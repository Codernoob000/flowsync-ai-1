import urllib.request
import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

key = "AIzaSyAP1KR6qocCHotUDR5hsz4vArLfYWqHzVA"

# Try more models and versions
tests = [
    ("v1beta", "gemini-2.5-flash"),
    ("v1beta", "gemini-2.5-flash-preview-04-17"),
    ("v1beta", "gemini-2.0-flash-exp"),
    ("v1beta", "gemini-1.5-pro"),
    ("v1beta", "gemini-1.5-flash-8b"),
    ("v1", "gemini-2.0-flash"),
    ("v1", "gemini-1.5-flash"),
]

print("Trying all Gemini models with new key...")
for version, model in tests:
    url = f"https://generativelanguage.googleapis.com/{version}/models/{model}:generateContent?key={key}"
    payload = json.dumps({"contents": [{"parts": [{"text": "Say hi."}]}]}).encode()
    req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
    try:
        with urllib.request.urlopen(req, timeout=10) as f:
            data = json.loads(f.read().decode())
            text = data['candidates'][0]['content']['parts'][0]['text']
            print(f"  OK  [{version}/{model}]: {text.strip()[:50]}")
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        try:
            err = json.loads(body).get('error', {})
            code = err.get('code')
            msg = err.get('message', '')[:80]
            # Check if it's quota or not found
            if code == 429:
                print(f"  QUOTA [{version}/{model}]: 429 exhausted")
            elif code == 404:
                print(f"  MISS  [{version}/{model}]: 404 not found")
            else:
                print(f"  ERR   [{version}/{model}]: {code} {msg}")
        except:
            print(f"  ERR   [{version}/{model}]: HTTP {e.code}")
    except Exception as e:
        print(f"  ERR   [{version}/{model}]: {e}")

# Also list available models
print("\nListing available models for this key...")
list_url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}"
try:
    with urllib.request.urlopen(list_url, timeout=10) as f:
        data = json.loads(f.read().decode())
        models = data.get('models', [])
        print(f"  Found {len(models)} models:")
        for m in models[:10]:
            name = m.get('name','')
            methods = m.get('supportedGenerationMethods', [])
            if 'generateContent' in methods:
                print(f"    - {name}")
except Exception as e:
    print(f"  List models error: {e}")
