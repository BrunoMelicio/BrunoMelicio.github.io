import functions_framework
import os
import json
import base64
import io
from google import genai
from google.genai import types
from PIL import Image

client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))
MODEL = "gemini-2.0-flash-exp-image-generation"

SYSTEM_PROMPT = """You are an expert AI hairstylist. Your task is to modify ONLY the hairstyle \
in this photo while keeping everything else (face, background, clothing, lighting) exactly the same.

IMPORTANT INSTRUCTIONS:
1. Keep the person's face, facial features, and expression EXACTLY the same
2. Only modify the hair/hairstyle
3. Maintain the same image quality, lighting, and background
4. The result should look like a realistic photo, not a drawing or cartoon

HAIRSTYLE TO APPLY:
{prompt}

Generate the modified image now."""

ALLOWED_ORIGINS = [
    "https://brunomelicio.com",
    "https://www.brunomelicio.com",
    "https://brunomelicio.github.io",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
]

HAIRSTYLES = {
    # Men's hairstyles
    "Buzz Cut": (
        "Transform this person's hairstyle to a clean buzz cut.\n"
        "The hair should be uniformly very short (about 3-6mm) all around the head.\n"
        "The cut should be even and well-maintained, with a slight fade near the temples.\n"
        "Keep the person's face, facial features, expression, skin tone, and background EXACTLY the same.\n"
        "Only modify the hair. The result should look like a realistic photograph."
    ),
    "Classic Fade": (
        "Transform this person's hairstyle to a classic fade haircut.\n"
        "The fade should gradually taper from skin-close at the temples and sides\n"
        "to about 1-2 inches of length on top.\n"
        "Maintain clean, sharp lines around the ears and neckline.\n"
        "The top should be slightly textured and can be styled to the side.\n"
        "Keep the person's face, facial features, expression, skin tone, and background EXACTLY the same.\n"
        "Only modify the hair. The result should look like a realistic photograph."
    ),
    "Curly Top Fade": (
        "Transform this person's hairstyle to a curly top fade.\n"
        "The top should have defined, voluminous curls (2-4 inches).\n"
        "The sides should have a sharp skin fade, transitioning from the curly top.\n"
        "The curls should look natural, healthy, and well-defined.\n"
        "Keep the person's face, facial features, expression, skin tone, and background EXACTLY the same.\n"
        "Only modify the hair. The result should look like a realistic photograph."
    ),
    "Taper Fade": (
        "Transform this person's hairstyle to a taper fade.\n"
        "The hair should gradually decrease in length from the top to the sides and back.\n"
        "The transition should be smooth and gradual, not a hard line.\n"
        "The top can have 2-3 inches of length, styled naturally or to the side.\n"
        "Keep the person's face, facial features, expression, skin tone, and background EXACTLY the same.\n"
        "Only modify the hair. The result should look like a realistic photograph."
    ),
    "High Top Fade": (
        "Transform this person's hairstyle to a high top fade (flat top).\n"
        "The top should be cut flat and squared off, creating a box shape.\n"
        "The height can be 2-4 inches on top.\n"
        "The sides should have a sharp skin fade.\n"
        "The look should be clean, geometric, and well-defined.\n"
        "Keep the person's face, facial features, expression, skin tone, and background EXACTLY the same.\n"
        "Only modify the hair. The result should look like a realistic photograph."
    ),
    "Braided Top": (
        "Transform this person's hairstyle to braids with faded sides.\n"
        "The top should have neat cornrows or box braids running back.\n"
        "The sides should have a skin fade or undercut.\n"
        "The braids should be clean, well-defined, and professional.\n"
        "Keep the person's face, facial features, expression, skin tone, and background EXACTLY the same.\n"
        "Only modify the hair. The result should look like a realistic photograph."
    ),
    "Dreadlocks": (
        "Transform this person's hairstyle to dreadlocks.\n"
        "The dreads should be well-formed, neat, and healthy-looking.\n"
        "The length can be medium to long, falling naturally or styled.\n"
        "Keep the person's face, facial features, expression, skin tone, and background EXACTLY the same.\n"
        "Only modify the hair. The result should look like a realistic photograph."
    ),
    "Man Bun": (
        "Transform this person's hairstyle to a man bun style.\n"
        "The hair should be long enough (6+ inches) to be gathered and tied in a bun at the back/top of the head.\n"
        "The sides can be either undercut/faded or left long and pulled back.\n"
        "The bun should be neat but can have some natural flyaways for a casual look.\n"
        "Keep the person's face, facial features, expression, skin tone, and background EXACTLY the same.\n"
        "Only modify the hair. The result should look like a realistic photograph."
    ),
    "Afro": (
        "Transform this person's hairstyle to a classic afro.\n"
        "The hair should be natural, voluminous, and rounded in shape.\n"
        "The afro should have good definition and healthy texture.\n"
        "The size should be medium to large, well-maintained and shaped.\n"
        "Keep the person's face, facial features, expression, skin tone, and background EXACTLY the same.\n"
        "Only modify the hair. The result should look like a realistic photograph."
    ),
    "Faux Hawk": (
        "Transform this person's hairstyle to a faux hawk (fohawk).\n"
        "The center strip of hair should be longer (2-3 inches) and styled upward.\n"
        "The sides should have a mid to high fade, but not completely shaved.\n"
        "The overall effect should be edgy but still appropriate for everyday wear.\n"
        "The center should have texture and volume, styled with product.\n"
        "Keep the person's face, facial features, expression, skin tone, and background EXACTLY the same.\n"
        "Only modify the hair. The result should look like a realistic photograph."
    ),
    # Women's hairstyles
    "Natural Curls": (
        "Transform this person's hairstyle to natural curls.\n"
        "The hair should have beautiful, well-defined curls throughout.\n"
        "The curls should look healthy, bouncy, and voluminous.\n"
        "The style should embrace natural texture with good curl definition.\n"
        "Keep the person's face, facial features, expression, skin tone, and background EXACTLY the same.\n"
        "Only modify the hair. The result should look like a realistic photograph."
    ),
    "Sleek & Straight": (
        "Transform this person's hairstyle to sleek, straight hair.\n"
        "The hair should be perfectly straight with a glossy, mirror-like finish.\n"
        "The style should look polished, sophisticated, and well-maintained.\n"
        "Keep the person's face, facial features, expression, skin tone, and background EXACTLY the same.\n"
        "Only modify the hair. The result should look like a realistic photograph."
    ),
    "Box Braids": (
        "Transform this person's hairstyle to box braids.\n"
        "The hair should be sectioned into neat box-shaped parts.\n"
        "Each section should be braided into individual braids.\n"
        "The braids should be neat, uniform, and well-maintained.\n"
        "Keep the person's face, facial features, expression, skin tone, and background EXACTLY the same.\n"
        "Only modify the hair. The result should look like a realistic photograph."
    ),
    "Classic Bob": (
        "Transform this person's hairstyle to a classic bob.\n"
        "The hair should be cut to chin length, with clean, blunt ends.\n"
        "The style should be sleek and polished, with a slight inward curve at the ends.\n"
        "The hair should look healthy, shiny, and well-maintained.\n"
        "Keep the person's face, facial features, expression, skin tone, and background EXACTLY the same.\n"
        "Only modify the hair. The result should look like a realistic photograph."
    ),
    "Natural Afro": (
        "Transform this person's hairstyle to a natural afro.\n"
        "The hair should be natural, voluminous, and beautifully shaped.\n"
        "The texture should be well-defined and healthy-looking.\n"
        "The afro should frame the face beautifully.\n"
        "Keep the person's face, facial features, expression, skin tone, and background EXACTLY the same.\n"
        "Only modify the hair. The result should look like a realistic photograph."
    ),
    "Pixie Cut": (
        "Transform this person's hairstyle to a pixie cut.\n"
        "The hair should be very short (1-2 inches) with slightly longer pieces on top.\n"
        "The style can have textured, piecey layers.\n"
        "The sides and back should be tapered short.\n"
        "The look should be chic, modern, and feminine.\n"
        "Keep the person's face, facial features, expression, skin tone, and background EXACTLY the same.\n"
        "Only modify the hair. The result should look like a realistic photograph."
    ),
    "Long Layers": (
        "Transform this person's hairstyle to long layers.\n"
        "The hair should be long (past shoulder length) with graduated layers.\n"
        "Face-framing layers should add dimension and movement.\n"
        "The style should look healthy, voluminous, and flowing.\n"
        "Keep the person's face, facial features, expression, skin tone, and background EXACTLY the same.\n"
        "Only modify the hair. The result should look like a realistic photograph."
    ),
    "High Ponytail": (
        "Transform this person's hairstyle to a high ponytail.\n"
        "The hair should be pulled up and secured at the crown of the head.\n"
        "The front should be sleek with no flyaways.\n"
        "The ponytail itself can be straight, wavy, or voluminous.\n"
        "Keep the person's face, facial features, expression, skin tone, and background EXACTLY the same.\n"
        "Only modify the hair. The result should look like a realistic photograph."
    ),
    "Butterfly Cut": (
        "Transform this person's hairstyle to a butterfly cut.\n"
        "The hair should have dramatic, face-framing layers at the front.\n"
        "The layers should fan out and create volume, resembling butterfly wings.\n"
        "The rest of the hair can be long with soft layers.\n"
        "Keep the person's face, facial features, expression, skin tone, and background EXACTLY the same.\n"
        "Only modify the hair. The result should look like a realistic photograph."
    ),
    "Hollywood Waves": (
        "Transform this person's hairstyle to Hollywood waves.\n"
        "The hair should have deep, glamorous S-shaped waves.\n"
        "The style should be polished and old Hollywood-inspired.\n"
        "The waves should be uniform and glossy.\n"
        "Keep the person's face, facial features, expression, skin tone, and background EXACTLY the same.\n"
        "Only modify the hair. The result should look like a realistic photograph."
    ),
    "Space Buns": (
        "Transform this person's hairstyle to space buns.\n"
        "The hair should be divided in half and styled into two buns on top of the head.\n"
        "The buns can be neat or slightly messy.\n"
        "The style should be playful, fun, and youthful.\n"
        "Keep the person's face, facial features, expression, skin tone, and background EXACTLY the same.\n"
        "Only modify the hair. The result should look like a realistic photograph."
    ),
    "Locs": (
        "Transform this person's hairstyle to locs (dreadlocks).\n"
        "The locs should be well-maintained and beautiful.\n"
        "They can be worn down, up, or styled creatively.\n"
        "Keep the person's face, facial features, expression, skin tone, and background EXACTLY the same.\n"
        "Only modify the hair. The result should look like a realistic photograph."
    ),
    "Bantu Knots": (
        "Transform this person's hairstyle to Bantu knots.\n"
        "The hair should be sectioned and coiled into small, neat knots across the head.\n"
        "The knots should be uniform and well-formed.\n"
        "Keep the person's face, facial features, expression, skin tone, and background EXACTLY the same.\n"
        "Only modify the hair. The result should look like a realistic photograph."
    ),
    "Micro Braids": (
        "Transform this person's hairstyle to micro braids.\n"
        "The hair should be styled into very thin, small individual braids.\n"
        "The braids should be neat, uniform, and well-maintained.\n"
        "Keep the person's face, facial features, expression, skin tone, and background EXACTLY the same.\n"
        "Only modify the hair. The result should look like a realistic photograph."
    ),
}

MAX_IMAGE_BYTES = 10 * 1024 * 1024


def cors_headers(request):
    origin = request.headers.get("Origin", "")
    allowed = origin if origin in ALLOWED_ORIGINS else ALLOWED_ORIGINS[0]
    return {
        "Access-Control-Allow-Origin": allowed,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "3600",
    }


@functions_framework.http
def stylist(request):
    headers = cors_headers(request)

    if request.method == "OPTIONS":
        return ("", 204, headers)

    if request.method != "POST":
        return (json.dumps({"error": "Method not allowed"}), 405, headers)

    try:
        data = request.get_json(silent=True) or {}
        image_b64 = data.get("image", "")
        hairstyle = data.get("hairstyle", "")

        if not image_b64:
            return (json.dumps({"error": "No image provided"}), 400, headers)

        if hairstyle not in HAIRSTYLES:
            return (json.dumps({"error": f"Unknown hairstyle: {hairstyle}"}), 400, headers)

        # Strip data URI prefix if present
        if "," in image_b64:
            image_b64 = image_b64.split(",", 1)[1]

        image_bytes = base64.b64decode(image_b64)

        if len(image_bytes) > MAX_IMAGE_BYTES:
            return (json.dumps({"error": "Image too large (max 10 MB)"}), 400, headers)

        # Open with PIL, resize if needed
        img = Image.open(io.BytesIO(image_bytes))
        max_dim = 1536
        if max(img.size) > max_dim:
            ratio = max_dim / max(img.size)
            new_size = (int(img.width * ratio), int(img.height * ratio))
            img = img.resize(new_size, Image.LANCZOS)

        if img.mode == "RGBA":
            img = img.convert("RGB")

        # Convert PIL image to JPEG bytes (like AIBarber does)
        img_byte_arr = io.BytesIO()
        img.save(img_byte_arr, format="JPEG", quality=95)
        img_byte_arr.seek(0)
        image_data = img_byte_arr.getvalue()

        # Create image part from bytes
        image_part = types.Part.from_bytes(
            data=image_data,
            mime_type="image/jpeg",
        )

        # Wrap the hairstyle prompt in the system instruction
        full_prompt = SYSTEM_PROMPT.format(prompt=HAIRSTYLES[hairstyle])

        response = client.models.generate_content(
            model=MODEL,
            contents=[full_prompt, image_part],
            config=genai.types.GenerateContentConfig(
                response_modalities=["IMAGE", "TEXT"],
            ),
        )

        # Extract generated image
        if response.candidates and response.candidates[0].content:
            for part in response.candidates[0].content.parts:
                if part.inline_data is not None:
                    result_b64 = base64.b64encode(part.inline_data.data).decode("utf-8")
                    mime = part.inline_data.mime_type or "image/png"
                    return (
                        json.dumps({"image": f"data:{mime};base64,{result_b64}"}),
                        200,
                        headers,
                    )

        return (
            json.dumps({"error": "The model did not return an image. Try a different photo or hairstyle."}),
            500,
            headers,
        )

    except Exception as e:
        return (json.dumps({"error": str(e)}), 500, headers)
