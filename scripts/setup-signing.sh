#!/usr/bin/env bash
# One-time setup of the Android signing key. Run it yourself, in a terminal:
#
#   bash scripts/setup-signing.sh
#
# It creates the keystore (or reuses the one already at the given path), stores
# it and its password as GitHub Actions secrets, then starts the build that
# publishes the release. The password is typed here and never leaves this
# machine except as an encrypted GitHub secret.

set -euo pipefail

REPO="aym3ntn-ai/classeuri"
ALIAS="classeuri"
KEYSTORE="${1:-$HOME/classeuri-release.jks}"

for tool in openssl gh; do
  command -v "$tool" >/dev/null || { echo "Missing tool: $tool" >&2; exit 1; }
done
gh auth status >/dev/null 2>&1 || { echo "Sign in first: gh auth login" >&2; exit 1; }

if gh secret list --repo "$REPO" | grep -q '^ANDROID_KEYSTORE_BASE64'; then
  echo "This repo already has a signing key."
  echo "Replacing it with a different key means installed apps can no longer be updated."
  read -r -p "Type REPLACE to continue: " answer
  [ "$answer" = "REPLACE" ] || exit 1
fi

if [ -e "$KEYSTORE" ]; then
  echo "Using the existing keystore: $KEYSTORE"
  read -r -s -p "Its password: " KS_PASS; echo
  export KS_PASS
  openssl pkcs12 -in "$KEYSTORE" -noout -passin env:KS_PASS 2>/dev/null \
    || { echo "Wrong password, or not a PKCS12 keystore." >&2; exit 1; }
else
  echo "Creating a new keystore: $KEYSTORE"
  read -r -s -p "Choose a password (6 characters or more): " KS_PASS; echo
  read -r -s -p "Type it again: " again; echo
  [ "$KS_PASS" = "$again" ] || { echo "The passwords do not match." >&2; exit 1; }
  [ "${#KS_PASS}" -ge 6 ] || { echo "Too short." >&2; exit 1; }
  export KS_PASS

  work=$(mktemp -d)
  trap 'rm -rf "$work"' EXIT
  openssl req -x509 -newkey rsa:2048 -nodes -days 10000 -subj "/CN=Classeuri" \
    -keyout "$work/key.pem" -out "$work/cert.pem" 2>/dev/null
  openssl pkcs12 -export -certpbe PBE-SHA1-3DES -keypbe PBE-SHA1-3DES \
    -inkey "$work/key.pem" -in "$work/cert.pem" -name "$ALIAS" \
    -out "$KEYSTORE" -passout env:KS_PASS
  chmod 600 "$KEYSTORE"
fi

echo "Saving the secrets to $REPO…"
base64 < "$KEYSTORE" | gh secret set ANDROID_KEYSTORE_BASE64 --repo "$REPO"
printf '%s' "$KS_PASS" | gh secret set ANDROID_KEYSTORE_PASSWORD --repo "$REPO"
printf '%s' "$KS_PASS" | gh secret set ANDROID_KEY_PASSWORD --repo "$REPO"
printf '%s' "$ALIAS" | gh secret set ANDROID_KEY_ALIAS --repo "$REPO"

gh workflow run android.yml --repo "$REPO" --ref main
cat <<DONE

Done. The signed build has started:
  https://github.com/$REPO/actions/workflows/android.yml
The release will appear here in about 20 minutes:
  https://github.com/$REPO/releases

KEEP THESE SAFE, outside the repo (password manager, private drive):
  - the file  $KEYSTORE
  - its password
Without them, future versions cannot update the installed app.
DONE
