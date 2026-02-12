import functions_framework
import os
import json
from google import genai
from google.genai import types

client = genai.Client(api_key=os.environ.get("GOOGLE_API_KEY"))

ALLOWED_ORIGINS = [
    "https://brunomelicio.com",
    "https://www.brunomelicio.com",
    "https://brunomelicio.github.io",
    "http://localhost:3000",
    "http://localhost:8000",
    "http://127.0.0.1:5500",
    "http://localhost:5500",
]

SYSTEM_PROMPT = """You are an expert translator for Cape Verdean Creole (Kriolu/Kriol).

RULES:
- Translate accurately between the specified languages.
- Use the ALUPEC spelling system for Kriol.
- When unsure, use Portuguese as intermediary: English → Portuguese → Kriol.
- For long text, translate the full text seamlessly.

KRIOL GRAMMAR:
- SVO word order.
- "ta" = habitual/present marker: "N ta papia" = I speak.
- "ka" = negation: "N ka ta konprende" = I don't understand.
- "dja" = past marker: "N dja kume" = I already ate.
- "bu" = you (informal), "bo" = your, "nha" = my, "e" = is, "ki" = that/which, "ku" = with, "di" = of/from, "pa" = for/to.
- Plurals: add "s" but often omitted in casual speech.
- Tense from context/particles, not verb endings.

VOCABULARY ANCHORS:
Hello = Olá | How are you? = Modi bu sta? | Good morning = Bon dia | Good afternoon = Boa tardi | Good night = Bo noiti | Goodbye = Te logu | Thank you = Obrigadu | Please = Pur favor | Yes = Sin | No = Nau | My name is = Nha nomi e... | I love you = Nta amabo | Water = Água | House = Kasa | I don't understand = N ka ta konprende | How much? = È kantu? | Do you speak Kriol? = Bu ta papia Kriolu?

RESPONSE FORMAT: Return ONLY a JSON object:
{"translation": "translated text here", "notes": "1-2 sentences of pronunciation tips or cultural context, or empty string"}
Do NOT wrap in markdown code blocks. Return raw JSON only."""

DIALECT_SANTIAGO = """
DIALECT: SANTIAGO (Badiu / Sotavento).
CRITICAL DISTINCTIONS — these are non-negotiable:
- "bu" = you (informal): "Modi bu sta?" (How are you?)
- "modi" = how: "Modi bu sta?" NOT "Manera"
- "N" for first person: "N ta bai" (I go)
- "Tcheu" = much/many. "Undi" = where.
- "Dja" past marker: "N dja kume" (I already ate)
- "Nha" = my. "Sta" used frequently.
- Stronger nasalization, more African-influenced vocabulary.
KEY EXAMPLES:
- How are you? = "Modi bu sta?"
- Where are you going? = "Undi bu ta bai?"
- What is your name? = "Kumé ki bu tchoma?"
Always output in Santiago dialect. NEVER use "bo" or "manera" — those are São Vicente."""

DIALECT_SAOVICENTE = """
DIALECT: SÃO VICENTE (Mindelense / Barlavento).
CRITICAL DISTINCTIONS — these are non-negotiable:
- "bo" = you (informal): "Manera bo ta?" (How are you?)
- "manera" = how: "Manera bo ta?" NOT "Modi"
- "M" or "Ma" for first person: "M ta bai" (I go)
- "Mot"/"Txeu" = much/many. "Ondê" = where.
- "Ja" past marker: "Ma ja kumê" (I already ate)
- Closer to Portuguese in vocabulary, more open vowels, less nasalization.
- "Minha" sometimes for "my".
KEY EXAMPLES:
- How are you? = "Manera bo ta?"
- Where are you going? = "Ondê bo ta bai?"
- What is your name? = "Kmo bo tchoma?"
Always output in São Vicente dialect. NEVER use "bu" or "modi" — those are Santiago."""

LANG_NAMES = {
    "en": "English",
    "pt": "Portuguese",
    "cv": "Cape Verdean Kriol",
}


def build_prompt(text, source_lang, target_lang, dialect):
    """Build the translation prompt."""
    system = SYSTEM_PROMPT
    if dialect == "saovicente" and target_lang == "cv":
        system += DIALECT_SAOVICENTE
    elif target_lang == "cv":
        system += DIALECT_SANTIAGO

    if source_lang == "auto":
        user_msg = (
            f"Auto-detect the language. "
            f"Translate to {LANG_NAMES.get(target_lang, 'Kriol')}:\n\n{text}"
        )
    else:
        src = LANG_NAMES.get(source_lang, source_lang)
        tgt = LANG_NAMES.get(target_lang, target_lang)
        user_msg = f"Translate from {src} to {tgt}:\n\n{text}"

    return system, user_msg


def cors_headers(request):
    """Return appropriate CORS headers."""
    origin = request.headers.get("Origin", "")
    allowed = origin if origin in ALLOWED_ORIGINS else ALLOWED_ORIGINS[0]
    return {
        "Access-Control-Allow-Origin": allowed,
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "3600",
    }


@functions_framework.http
def translate(request):
    """HTTP Cloud Function for Kriol translation."""
    headers = cors_headers(request)

    # Handle preflight
    if request.method == "OPTIONS":
        return ("", 204, headers)

    if request.method != "POST":
        return (json.dumps({"error": "Method not allowed"}), 405, headers)

    try:
        data = request.get_json(silent=True) or {}
        text = data.get("text", "").strip()
        source_lang = data.get("sourceLang", "auto")
        target_lang = data.get("targetLang", "cv")
        dialect = data.get("dialect", "santiago")

        if not text:
            return (json.dumps({"error": "No text provided"}), 400, headers)

        if len(text) > 5000:
            return (json.dumps({"error": "Text too long (max 5000 characters)"}), 400, headers)

        system_prompt, user_msg = build_prompt(text, source_lang, target_lang, dialect)

        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=[
                {"role": "user", "parts": [{"text": system_prompt}]},
                {"role": "model", "parts": [{"text": '{"translation": "", "notes": ""}'}]},
                {"role": "user", "parts": [{"text": user_msg}]},
            ],
            config=types.GenerateContentConfig(
                response_mime_type="application/json",
                temperature=0.3,
            ),
        )

        result = json.loads(response.text)
        return (json.dumps(result, ensure_ascii=False), 200, headers)

    except json.JSONDecodeError:
        # Gemini returned non-JSON, return raw text
        return (
            json.dumps({"translation": response.text, "notes": ""}, ensure_ascii=False),
            200,
            headers,
        )
    except Exception as e:
        return (json.dumps({"error": str(e)}), 500, headers)
