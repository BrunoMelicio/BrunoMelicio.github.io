#!/usr/bin/env python3
"""Build the Braids gallery catalogue from the local gallery workspace only.

The resulting JSON is deliberately source-aware. A prompt may be:
  - source: matched to a prompt stored in the gallery workspace;
  - reconstructed: written from the visible result when no source prompt survives;
  - source-pack: linked to a prompt section inside a packaged PDF;
  - needs-review: model/aspect are known, but a prompt is not yet attributed.
"""

from __future__ import annotations

import json
import html
import re
import subprocess
import zipfile
from dataclasses import dataclass
from datetime import date
from difflib import SequenceMatcher
from math import gcd
from pathlib import Path
from typing import Any
from xml.etree import ElementTree

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
GALLERY = ROOT / "assets" / "gallery"
OUTPUT = GALLERY / "gallery-metadata.json"
PRIVATE_OUTPUT = ROOT / ".private" / "gallery-catalogue.json"
REVIEW_OUTPUT = ROOT / ".private" / "gallery-review.html"
IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".webp"}
VIDEO_EXTENSIONS = {".mp4", ".mov", ".m4v", ".webm"}


@dataclass
class PromptRecord:
    title: str
    prompt: str
    source: str


def clean_title(value: str) -> str:
    value = re.sub(r"^\d+\s*[·.:-]\s*", "", value.strip())
    value = re.sub(r"\s+", " ", value)
    return value.strip(" —–-")


def parse_markdown_prompts() -> list[PromptRecord]:
    records: list[PromptRecord] = []
    for path in sorted(GALLERY.rglob("*.md")):
        text = path.read_text(encoding="utf-8", errors="ignore")
        sections = re.finditer(
            r"^###\s+(.+?)\s*$\n(.*?)(?=^###\s+|\Z)",
            text,
            flags=re.MULTILINE | re.DOTALL,
        )
        for match in sections:
            title = clean_title(match.group(1))
            body = match.group(2).strip()
            fenced = re.search(r"```(?:json|text)?\s*(.*?)```", body, re.DOTALL | re.IGNORECASE)
            prompt = (fenced.group(1) if fenced else body).strip()
            if len(prompt) < 40:
                continue
            records.append(
                PromptRecord(
                    title=title,
                    prompt=prompt,
                    source=path.relative_to(ROOT).as_posix(),
                )
            )
    return records


def parse_docx_prompts() -> list[PromptRecord]:
    """Read prompt blocks from local Word sources without requiring python-docx."""
    records: list[PromptRecord] = []
    titles = [
        "Gamer Room UGC",
        "Night Lounge UGC",
        "Luxury Staircase UGC",
        "Stadium UGC Portrait",
        "Safety Goggles Editorial",
    ]
    for path in sorted(GALLERY.rglob("*.docx")):
        try:
            with zipfile.ZipFile(path) as archive:
                root = ElementTree.fromstring(archive.read("word/document.xml"))
        except Exception:
            continue

        namespace = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"
        paragraphs: list[str] = []
        for paragraph in root.iter(f"{namespace}p"):
            text = "".join(node.text or "" for node in paragraph.iter(f"{namespace}t")).strip()
            paragraphs.append(text)

        blocks: list[str] = []
        current: list[str] = []
        for paragraph in paragraphs:
            if paragraph:
                current.append(paragraph)
            elif current:
                blocks.append("\n".join(current).strip())
                current = []
        if current:
            blocks.append("\n".join(current).strip())

        for index, block in enumerate(block for block in blocks if len(block) >= 80):
            title = titles[index] if index < len(titles) else f"UGC prompt {index + 1}"
            records.append(
                PromptRecord(
                    title=title,
                    prompt=block,
                    source=path.relative_to(ROOT).as_posix(),
                )
            )
    return records


PROMPTS = parse_markdown_prompts() + parse_docx_prompts()


def find_prompt(title_fragment: str) -> PromptRecord | None:
    needle = title_fragment.lower()
    exact = [record for record in PROMPTS if needle in record.title.lower()]
    if exact:
        return max(exact, key=lambda item: len(item.prompt))
    return None


def infer_model(path: Path) -> tuple[str, str]:
    name = path.name.lower()
    stem = path.stem.lower()
    if name.startswith("hf_") or re.search(r"(?:^|_)hf\d*$", stem):
        if path.suffix.lower() in VIDEO_EXTENSIONS:
            return "Seedance 2.0", "high"
        return "Higgsfield Soul 2", "high"
    if "chatgpt" in name or re.search(r"(?:^|_)gpt\d*$", stem):
        return "GPT Image 2", "high"
    if re.search(r"(?:^|_)(?:gem|gemini)\d*$", stem):
        return "Gemini · Nano Banana 2", "high"
    if re.search(r"(?:^|_)(?:gk|grok)\d*$", stem):
        return "Grok", "high"
    if name.startswith(("woman_", "man_", "model_", "a_macro_", "create_a_", "act_as_a_")):
        return "Gemini · Nano Banana 2", "medium"
    if re.fullmatch(r"[0-9a-f-]{32,}\.(?:jpg|jpeg|png|webp)", name):
        return "Grok", "medium"
    if "bryanai_" in name:
        return "Midjourney", "medium"
    return "Model not recorded", "unknown"


COMMON_RATIOS = {
    "1:1": 1.0,
    "4:5": 0.8,
    "3:4": 0.75,
    "2:3": 2 / 3,
    "9:16": 9 / 16,
    "16:9": 16 / 9,
    "3:2": 1.5,
    "4:3": 4 / 3,
}


def aspect_label(width: int, height: int) -> str:
    ratio = width / height
    label, value = min(COMMON_RATIOS.items(), key=lambda item: abs(item[1] - ratio))
    if abs(value - ratio) <= 0.025:
        return label
    divisor = gcd(width, height)
    left, right = width // divisor, height // divisor
    if max(left, right) <= 30:
        return f"{left}:{right}"
    return f"{ratio:.2f}:1"


def category_from_path(path: Path) -> str:
    haystack = path.as_posix().lower()
    if "/influencers/" in f"/{haystack}":
        return "ugc"
    if "/videos/" in f"/{haystack}":
        return "video"
    categories = (
        ("sports", ("athlete", "stadium", "football", "locker", "match", "gym")),
        ("products", ("product", "macro", "ugc", "bag", "watch", "coffee", "knit")),
        ("cinematic", ("film", "cinematic", "archival", "character", "manor")),
        ("natural", ("realistic", "beach", "hotel", "restaurant", "iphone", "selfie", "street")),
        ("portraits", ("portrait", "studio", "editorial", "model", "person", "woman", "man")),
    )
    for category, words in categories:
        if any(word in haystack for word in words):
            return category
    return "other"


PACK_CONFIG: dict[str, dict[str, Any]] = {
    "assets_beach": {
        "source": "studio/assets/gallery/Packs/BEACH_DAYS_Prompt_Pack.pdf",
        "codes": {
            "wl": "Waterline Walk", "sl": "Sea-Ladder Climb-Out", "db": "Beach-Club Daybed",
            "ws": "Wet Sand, Low Angle", "bb": "Beach Bar at Night", "bw": "Boardwalk Cover-Up",
            "os": "Outdoor Shower Rinse", "cm": "Catamaran Net Deck", "rp": "Rock Pool",
            "tw": "Sandy Beach Towel", "bt": "Beach-Club Daybed", "pl": "Poolside Lounger",
        },
    },
    "assets_blonde2": {
        "source": "studio/assets/gallery/Packs/THE_BLONDE_Prompt_Pack.pdf",
        "codes": {
            "mc": "Golden Morning Coffee", "tr": "Trocadéro Sunrise", "pb": "Parisian Balcony",
            "dn": "Candlelit Dinner", "db": "Beach Club Daybed", "sl": "Amalfi Sea Ladder",
            "ub": "Hotel Suite Unboxing", "rn": "Caught in the Rain", "sp": "Airport Sprint",
            "aw": "Airplane Window", "tt": "The Tiny Tattoo", "as": "Birthday Sparkler",
        },
    },
    "assets_brz": {
        "source": "studio/assets/gallery/Packs/THE_BRUNETTES_Prompt_Pack.pdf",
        "codes": {
            "el": "Hotel Elevator Mirror", "jt": "Private Jet Steps", "vip": "VIP Booth",
            "yt": "Yacht Deck", "es": "Department-Store Escalator", "pl": "Rooftop Infinity Pool",
            "rf": "Rooftop Golden Hour", "om": "Outfit-Check Mirror", "cw": "Caught in the Rain",
        },
    },
    "assets_dark": {
        "source": "studio/assets/gallery/Packs/AFTER_DARK_AdultsOnly_Prompt_Pack.pdf",
        "codes": {
            "robe": "Silk Robe, Morning Window", "lace": "Lace Bodysuit & Blazer",
            "slip": "Satin Slip, Low Back", "mesh": "Sheer Mesh, Rooftop Night",
            "cor": "Corset & Low Jeans", "knit": "Knit Dress & Thigh Boots",
            "stair": "Low-Angle Legs, Staircase", "pool": "Poolside, From Behind",
            "den": "Denim Cut-Offs, From Behind", "side": "Side-On Mirror, Knit Dress",
            "gym": "Gym-Set Bathroom Mirror", "bch": "Balcony, Hard Sun Flash",
        },
    },
    "assets_eric": {
            "source": "studio/assets/gallery/Packs/UNIQUE_CHARACTERS_Vol1_The_Vitiligos.pdf",
        "codes": {
            "bed": "Bedroom Window Portrait", "cof": "Kitchen Pour-Over",
            "car": "Golden-Hour Car", "gym": "Gym Mirror", "sofa": "Sofa, One Lamp",
            "st": "Street, A Friend Took It",
        },
    },
}


def prompt_for_pack(path: Path) -> tuple[str | None, str | None, str | None, str]:
    folder = path.parent.name
    config = PACK_CONFIG.get(folder)
    if not config:
        return None, None, None, "needs-review"
    code = path.stem.split("_")[0]
    title = config["codes"].get(code)
    if not title:
        return None, None, config["source"], "needs-review"
    record = find_prompt(title)
    if record:
        return record.prompt, title, record.source, "source"
    return (
        f"This image belongs to the “{title}” prompt in its original Braids pack. "
        "The complete prompt is preserved in the source guide and will be normalized in a later catalogue pass.",
        title,
        config["source"],
        "source-pack",
    )


PUBLIC_OVERRIDES: dict[str, dict[str, Any]] = {
    "showcase_1/model.png": {"title": "Editorial portrait", "category": "portraits", "model": "Higgsfield Soul 2", "modelConfidence": "high", "prompt_ref": "Beauty Dish Classic"},
    "showcase_1/product.png": {
        "title": "Product study", "category": "products", "model": "Midjourney v7", "modelConfidence": "high", "prompt_title": "Orange knit product study",
        "prompt": "Chunky knit beanie in burnt orange/terracotta color, ribbed texture, no branding, slight slouch fit, wool material --ar 1:1 --v 7",
        "promptSource": "Embedded PNG metadata",
        "promptStatus": "source-metadata",
    },
    "hf_20260116_224541_e2fb4b3b-4db7-464f-baa3-d66c23528308.png": {
        "title": "Locker room", "category": "sports", "prompt_title": "Locker-room focus",
        "prompt": "A realistic editorial football portrait of a young professional player seated alone on a locker-room bench in a deep-blue kit, both hands resting on a football, shoulders slightly forward, focused expression. Blue lockers and hanging shirts recede behind him, cool overhead room light mixes with a narrow cinematic rim light, light haze in the air, vertical full-body composition, natural skin and fabric detail.",
    },
    "ChatGPT Image Jul 22, 2026, 11_05_29 AM.png": {"title": "Amalfi coast", "category": "natural", "prompt_ref": "Sea-Ladder Climb-Out"},
    "i.PNG": {
        "title": "The arrival", "category": "cinematic", "model": "Higgsfield Soul 2", "modelConfidence": "high", "prompt_title": "The arrival",
        "prompt": "A restrained cinematic full-body portrait of a sharply dressed man in a charcoal overcoat and flat cap standing beside a grey wolf outside a grand dark-green Georgian doorway. Wet stone steps, clipped topiary, overcast daylight, quiet tension, period-drama palette, realistic fabric and fur, deep vertical composition, no text or fantasy effects.",
    },
    "showcase_1/0f40e4ef-bcc1-4652-8520-199079124c27.png": {
        "title": "Ice-field editorial", "category": "cinematic", "prompt_title": "Ice-field editorial",
        "prompt": "A full-length high-fashion editorial on a vast blue-white glacier: a woman in a sculptural black coat and burnt-orange knit beanie stands beside a calm grey-and-white husky. Wind lifts the coat hem, distant ice ridges disappear into pale atmospheric haze, cool overcast light, natural face and fur detail, restrained luxury campaign styling, vertical composition.",
    },
    "ChatGPT Image Jul 22, 2026, 11_11_15 AM.png": {"title": "Hotel morning", "category": "natural", "prompt_ref": "Hotel Bed, Morning Robe"},
    "A_macro_photograph_2k_202602221555.JPEG": {
        "title": "Leather study", "category": "products", "prompt_title": "Black leather macro",
        "prompt": "Extreme close product photograph of a structured black pebbled-leather briefcase held by one hand. Focus on the grain, stitched handle, polished clasp and subtle edge wear; warm directional late-afternoon light, very shallow depth of field, dark neutral wardrobe softly blurred behind, premium tactile realism, vertical macro crop, no logo or text.",
    },
    "hf_20260117_013802_ee68dd6a-1866-4ee5-a6f7-72bf71878827.png": {
        "title": "Match night", "category": "sports", "prompt_title": "Match-night focus",
        "prompt": "A moody match-night football portrait of a young professional player seated centrally on a bench, wearing a deep-blue kit and holding a white football between both hands. A glass tactics wall and blue stadium light glow behind him, faint haze, symmetrical vertical framing, strong but natural facial detail, reflective floor, realistic sports editorial photography.",
    },
    "9a9a0334-e504-448e-bb1f-2ca487cf4c66.jpg": {"title": "Natural beauty", "category": "portraits", "prompt_ref": "High-Key Beauty Macro"},
    "hf_20260722_110441_285fcd86-de86-422e-b64a-6c0be8360d64.png": {"title": "Dinner light", "category": "natural", "prompt_ref": "Candlelit Dinner"},
    "ChatGPT Image Jul 22, 2026, 08_44_48 PM.png": {"title": "The duo", "category": "portraits", "prompt_ref": "The Duo Cover"},
    "Model_standing_against_wall_2K_202607232008 (1).jpeg": {"title": "Monochrome blue", "category": "portraits", "prompt_ref": "Colour-Block Minimalism"},
    "ChatGPT Image Jul 25, 2026 at 04_44_59 PM.png": {
        "title": "Passing moment", "category": "natural", "prompt_title": "Passing street moment",
        "prompt": "An unpolished arm's-length phone photograph of a stylish man turning toward the camera mid-conversation on a real city pavement. Beige workwear jacket over a dark shirt, relaxed hand gesture entering frame, café tables and pedestrians behind, soft overcast daylight, slight wide-angle perspective, imperfect candid framing, natural skin texture and street detail.",
    },
    "influencers/African/ChatGPT Image Jul 14, 2026, 04_51_40 PM.png": {
        "title": "Everyday UGC character", "category": "ugc", "featured": True,
    },
    "influencers/Asian/hf_20260714_172813_9df23e4f-9ebe-461e-bc70-d36291a9435e.png": {
        "title": "Natural-light UGC character", "category": "ugc", "featured": True,
    },
    "influencers/European/ChatGPT Image Jul 14, 2026, 05_09_39 PM.png": {
        "title": "At-home UGC character", "category": "ugc", "featured": True,
    },
    "influencers/Indian/ChatGPT Image Jul 14, 2026, 05_13_29 PM.png": {
        "title": "Conversational UGC character", "category": "ugc", "featured": True,
    },
    "influencers/Latina/hf_20260714_172002_a5c149e3-a069-4d5d-b42f-0ae1378c911d.png": {
        "title": "Lifestyle UGC character", "category": "ugc", "featured": True,
    },
    "videos/hf_20260717_071344_efdd70e6-7078-4077-945b-b1d8ae253d22.mp4": {
        "title": "Plush UGC product demo",
        "category": "ugc",
        "model": "Seedance 2.0",
        "modelConfidence": "high",
        "featured": True,
        "prompt_title": "Plush UGC product demo",
        "promptSource": "studio/assets/gallery/videos/como-recriar-video-seedance.pdf · Portuguese",
        "promptStatus": "source",
        "prompt": """Trava de identidade e cena\nUse @personagem como quadro inicial exato e trava de identidade facial. Consistência facial estrita durante todo o vídeo — não redescreva nem reestilize a pessoa. Mantenha o visual original (cabelo, roupa, cenário e luz) da imagem de referência. Ela segura e gira @produto com a mão direita.\n\nCaptação (fixa)\nSelfie frontal, celular na mão esquerda; leve tremor sincronizado com a respiração e com o braço direito erguendo o produto. Lente grande-angular de celular (~26mm). Luz natural suave; leve variação de exposição quando o produto entra no quadro.\n\nBloco 1 (0–3,5s) — abertura\nEla começa com o olhar levemente baixo, depois ergue os olhos para a lente enquanto a mão direita levanta o produto ao lado do rosto. Leve tremor de mão; foco passa do rosto para o produto.\nFala: “Aiii, gente... olha o que a minha mãe fez.”\n\nBloco 2 (3,5–7s) — giro e reação genuína\nEla gira o produto para mostrar outro ângulo ou detalhe, com um sorriso genuíno no meio da frase e uma piscada natural.\nFala: “Ela é fã demais disso.” (adapte para seu produto)\n\nBloco 3 (7–10s) — fechamento\nEla puxa o produto contra o ombro, aperta gentilmente, inclina a cabeça e olha direto para a lente.\nFala (sussurrada, afetuosa): “Ai... que fofura.”\n\nTrava de realismo e negativos\nPele com textura real, piscadas e respiração naturais, fala em PT-BR pausada e com sincronia labial natural. Produto com textura e peso reais. Evitar: leve compressão ao ser apertado. Evitar troca de identidade, lábios fora de sincronia, pele “photoshopada”, filtro de beleza, brilho artificial de IA, flutuação de câmera irreal, entonação robótica.""",
    },
    "videos/hf_20260608_094832_e565fd6d-a79c-4a1d-bcae-c38dd42dcaf0.mp4": {
        "title": "Supporter selfie", "category": "video", "featured": True,
    },
    "videos/hf_20260608_095959_f59e1e6a-b600-41a0-8c65-19bc8a0ac2c1.mp4": {
        "title": "Stadium arrival", "category": "video", "featured": True,
    },
    "videos/hf_20260608_102211_9d9e6b20-63e4-44bb-9666-fa65c12f46e6.mp4": {
        "title": "Match-day UGC", "category": "video", "featured": True,
    },
}


def fuzzy_prompt_from_filename(path: Path) -> PromptRecord | None:
    raw = re.sub(r"[_-]+", " ", path.stem)
    raw = re.sub(r"\b(?:2k|20\d{10,}|\d+)\b", " ", raw, flags=re.IGNORECASE)
    raw = re.sub(r"\s+", " ", raw).strip().lower()
    if len(raw) < 8:
        return None
    scored = []
    for record in PROMPTS:
        score = SequenceMatcher(None, raw, record.title.lower()).ratio()
        if score >= 0.55:
            scored.append((score, record))
    return max(scored, default=(0, None), key=lambda item: item[0])[1]


def apply_public_override(item: dict[str, Any], override: dict[str, Any]) -> None:
    item.update({key: value for key, value in override.items() if key not in {"prompt_ref"}})
    item["featured"] = True
    if "prompt_ref" in override:
        record = find_prompt(override["prompt_ref"])
        if record:
            item.update(
                prompt=record.prompt,
                promptTitle=record.title,
                promptSource=record.source,
                promptStatus="source",
            )
        else:
            item["promptStatus"] = "needs-review"
    elif override.get("prompt"):
        item.update(
            promptSource=override.get("promptSource"),
            promptStatus=override.get("promptStatus", "reconstructed"),
        )


def build_item(path: Path) -> dict[str, Any] | None:
    try:
        with Image.open(path) as image:
            width, height = image.size
    except Exception:
        return None
    relative = path.relative_to(GALLERY).as_posix()
    model, model_confidence = infer_model(path)
    item: dict[str, Any] = {
        "id": re.sub(r"[^a-z0-9]+", "-", relative.lower()).strip("-"),
        "path": relative,
        "mediaType": "image",
        "title": clean_title(path.stem.replace("_", " ")),
        "category": category_from_path(path),
        "model": model,
        "modelConfidence": model_confidence,
        "width": width,
        "height": height,
        "aspectRatio": aspect_label(width, height),
        "featured": False,
        "prompt": None,
        "promptTitle": None,
        "promptSource": None,
        "promptStatus": "needs-review",
    }

    if path.parent.name.startswith("assets_"):
        prompt, title, source, status = prompt_for_pack(path)
        item.update(prompt=prompt, promptTitle=title, promptSource=source, promptStatus=status)
    else:
        fuzzy = fuzzy_prompt_from_filename(path)
        if fuzzy:
            item.update(
                prompt=fuzzy.prompt,
                promptTitle=fuzzy.title,
                promptSource=fuzzy.source,
                promptStatus="source",
            )

    if relative in PUBLIC_OVERRIDES:
        apply_public_override(item, PUBLIC_OVERRIDES[relative])
    return item


def build_video_item(path: Path) -> dict[str, Any] | None:
    relative = path.relative_to(GALLERY).as_posix()
    try:
        result = subprocess.run(
            [
                "ffprobe", "-v", "error", "-select_streams", "v:0",
                "-show_entries", "stream=width,height:format=duration", "-of", "json", str(path),
            ],
            capture_output=True,
            text=True,
            check=True,
        )
        probe = json.loads(result.stdout)
        stream = probe["streams"][0]
        width, height = int(stream["width"]), int(stream["height"])
        duration = round(float(probe.get("format", {}).get("duration", 0)), 1)
    except Exception:
        return None

    model, model_confidence = infer_model(path)
    item: dict[str, Any] = {
        "id": re.sub(r"[^a-z0-9]+", "-", relative.lower()).strip("-"),
        "path": relative,
        "mediaType": "video",
        "title": clean_title(path.stem.replace("_", " ")),
        "category": category_from_path(path),
        "model": model,
        "modelConfidence": model_confidence,
        "width": width,
        "height": height,
        "aspectRatio": aspect_label(width, height),
        "duration": duration,
        "featured": False,
        "prompt": None,
        "promptTitle": None,
        "promptSource": None,
        "promptStatus": "needs-review",
    }
    if relative in PUBLIC_OVERRIDES:
        apply_public_override(item, PUBLIC_OVERRIDES[relative])
    return item


def write_review_page(items: list[dict[str, Any]]) -> None:
    review_items = [item for item in items if item["promptStatus"] == "needs-review"]
    cards = []
    for index, item in enumerate(review_items, 1):
        review_id = f"BR-{index:03d}"
        item["reviewId"] = review_id
        path = html.escape(item["path"], quote=True)
        title = html.escape(item["title"])
        model = html.escape(item["model"])
        if item.get("mediaType") == "video":
            media = f'<video src="../assets/gallery/{path}" muted controls preload="metadata"></video>'
        else:
            media = f'<img src="../assets/gallery/{path}" alt="" loading="lazy">'
        cards.append(
            f'<article data-model="{model.lower()}" data-path="{path}">{media}'
            f'<div><strong>{review_id}</strong><span>{model} · {item["aspectRatio"]}</span>'
            f'<p>{title}</p><code>{path}</code><button data-copy="{review_id}">Copy ID</button></div></article>'
        )
    page = f"""<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Braids private attribution review</title><style>
    *{{box-sizing:border-box}}body{{margin:0;background:#f5f5f3;color:#101010;font:14px/1.4 Arial,sans-serif}}header{{position:sticky;top:0;z-index:3;padding:22px;background:#fff;border-bottom:1px solid #ddd}}h1{{margin:0 0 8px;font-size:28px}}header p{{margin:0;color:#666}}main{{padding:20px;display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:14px}}article{{overflow:hidden;border:1px solid #ddd;border-radius:16px;background:#fff}}img,video{{width:100%;height:280px;display:block;object-fit:contain;background:#eee}}article div{{padding:14px}}strong,span,code{{display:block}}strong{{font-size:18px}}span{{margin:5px 0;color:#555}}p{{margin:12px 0;font-weight:700}}code{{min-height:38px;overflow-wrap:anywhere;color:#777;font-size:11px}}button{{margin-top:12px;padding:8px 11px;border:1px solid #ccc;border-radius:999px;background:#fff;cursor:pointer}}</style><header><h1>Braids attribution review</h1><p>{len(review_items)} assets need a source prompt match. Tell me the BR-ID and the prompt/model correction.</p></header><main>{''.join(cards)}</main><script>document.addEventListener('click',e=>{{if(!e.target.dataset.copy)return;navigator.clipboard.writeText(e.target.dataset.copy);e.target.textContent='Copied';}})</script></html>"""
    REVIEW_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    REVIEW_OUTPUT.write_text(page, encoding="utf-8")


def main() -> None:
    items = []
    for path in sorted(GALLERY.rglob("*")):
        if not path.is_file() or "posters" in path.parts:
            continue
        if path.suffix.lower() in IMAGE_EXTENSIONS:
            item = build_item(path)
            if item:
                items.append(item)
        elif path.suffix.lower() in VIDEO_EXTENSIONS:
            item = build_video_item(path)
            if item:
                items.append(item)

    write_review_page(items)

    summary: dict[str, int] = {}
    for item in items:
        summary[item["promptStatus"]] = summary.get(item["promptStatus"], 0) + 1

    private_output = {
        "version": 1,
        "generatedOn": date.today().isoformat(),
        "scope": "studio/assets/gallery only",
        "notes": [
            "Model names are inferred from filenames and pack conventions supplied by Bruno Melício.",
            "Reconstructed prompts are transparent editorial reconstructions, not claims of recovered originals.",
            "Items marked needs-review remain catalogued for future attribution but are not shown publicly.",
        ],
        "summary": {"assets": len(items), "promptStatuses": summary},
        "sourcePrompts": [record.__dict__ for record in PROMPTS],
        "items": items,
    }
    PRIVATE_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    PRIVATE_OUTPUT.write_text(
        json.dumps(private_output, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    # GitHub Pages is a public static host. Only prompts deliberately featured as
    # free gallery/template content may be present in its deployable JSON. The
    # complete working catalogue stays in the gitignored .private directory.
    public_items = []
    for item in items:
        public_item = dict(item)
        if not item["featured"]:
            had_attribution = bool(item["prompt"])
            public_item.update(
                prompt=None,
                promptTitle=None,
                promptSource=None,
                promptStatus="locked" if had_attribution else "unattributed",
            )
        public_items.append(public_item)

    public_summary: dict[str, int] = {}
    for item in public_items:
        public_summary[item["promptStatus"]] = public_summary.get(item["promptStatus"], 0) + 1

    public_output = {
        "version": 1,
        "generatedOn": date.today().isoformat(),
        "scope": "public Braids gallery catalogue",
        "notes": [
            "All assets retain model and aspect-ratio metadata.",
            "Only deliberately featured free prompts are included in this public file.",
            "Paid/source-pack prompt text remains in the local private catalogue.",
        ],
        "summary": {"assets": len(public_items), "promptStatuses": public_summary},
        "items": public_items,
    }
    OUTPUT.write_text(json.dumps(public_output, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Wrote {len(items)} private assets to {PRIVATE_OUTPUT}")
    print(f"Wrote {len(public_items)} public assets to {OUTPUT}")
    print(json.dumps(summary, indent=2))


if __name__ == "__main__":
    main()
