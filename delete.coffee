child = require('child_process').exec

exec "/root/workspace/severus/delete.bh", (err1, out, err2) ->
  console.log out
  console.log "hi"
