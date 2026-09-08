python3 -m http.server 3002 &
PID=$!
sleep 1
curl -s http://localhost:3002/missing
kill $PID
