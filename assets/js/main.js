window.onload = function () {
  const socket = io()
  socket.emit('regist', getCookie('token'))
  socket.once('regist', function (data) {
    if (!data.success) window.location.reload()
  })

  socket.on('data', (datas) => {
    for (const index in datas) {
      const data = datas[index]
      const table = document.getElementsByTagName('table')[0]
    
      const row = table.insertRow(1)
      const code = row.insertCell()
      const ip = row.insertCell()
      const method = row.insertCell()
      const host = row.insertCell()
      const headers = row.insertCell()
      const target = row.insertCell()
      const onssl = row.insertCell()
      const blocked = row.insertCell()
      const logAt = row.insertCell()
    
      code.innerText = data.code
      ip.innerText = data.ip
      method.innerText = data.method
      host.innerText = data.host
      headers.innerText = data.headers
      target.innerText = data.target
      onssl.innerText = data.onssl
      blocked.innerText = data.blocked
      logAt.innerText = data.logAt

      headers.style.fontSize = '5px'
      headers.style.width = '100px'
    }
  })
}

function getCookie(name) {
  var nameEQ = name + "=";
  var ca = document.cookie.split(';');
  for(var i=0;i < ca.length;i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1,c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
  }
  return null;
}
