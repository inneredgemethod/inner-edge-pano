#!/usr/bin/env bash
# Test sunucusunu TEMIZ baslatir.
#
# Neden gerekli: `pkill -f "next start"` asil sureci OLDURMEZ (o `next-server`
# adiyla calisir). Eski surec portu tutmaya devam eder, yeni build sessizce
# baslamaz ve testler ESKI kodu test eder. Bu tuzaga birkac kez dusuldu.
set -euo pipefail
PORT="${1:-3002}"

lsof -ti "tcp:$PORT" 2>/dev/null | xargs -r kill -9 || true
sleep 2
if lsof -ti "tcp:$PORT" > /dev/null 2>&1; then
  echo "HATA: $PORT hala dolu." >&2
  exit 1
fi

rm -rf .next
npm run build > /tmp/pano-build.log 2>&1 || { echo "BUILD BASARISIZ:"; tail -20 /tmp/pano-build.log; exit 1; }

PORT="$PORT" npm run start > /tmp/pano-prod.log 2>&1 &
for _ in $(seq 1 40); do
  if curl -s -o /dev/null "http://localhost:$PORT/giris" 2>/dev/null; then
    echo "test sunucusu hazir: http://localhost:$PORT"
    exit 0
  fi
  sleep 1
done
echo "HATA: sunucu acilmadi." >&2
tail -20 /tmp/pano-prod.log >&2
exit 1
