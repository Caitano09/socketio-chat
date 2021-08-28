import React, {useEffect, useRef} from 'react'

const Room = (props) => {
    const mediaRecorder = useRef(null)
    const updateMessages = useRef(null)
    const roomId = props.match.params.room

    useEffect(() => {

        props.setNewRoom(roomId) 
        props.socket.emit('join', roomId)

            //let audioPermission = false       
            navigator
              .mediaDevices
              .getUserMedia({audio: true})
              .then(stream => {
                ///audioPermission = true
                mediaRecorder.current = new MediaRecorder(stream)
                let chunks = []
                mediaRecorder.current.ondataavailable = data =>{
                  // data received
                  chunks.push(data.data)
                }
                mediaRecorder.current.onstop = () =>{
                  //data stopped
      
                  const reader = new window.FileReader()
                  const blob = new Blob(chunks, {type: 'audio/ogg; codec=opus'})
                  reader.readAsDataURL(blob)
                  reader.onloadend = () =>{
                    props.socket.emit('sendAudio', {
                      data: reader.result,
                      room: roomId
                    })
                  }
      
                 chunks = []
                }
              }, err => {
                //audioPermission = false
                mediaRecorder.current = null
              })
    
    },[updateMessages.current, roomId]);

    const mouseUp =() =>{
        mediaRecorder.current.stop()
    }
    const mouseDown = () =>{    
        mediaRecorder.current.start()
    }

    const handleKey = (event) => {

        if (event.keyCode === 13) {
            //enviar a mensagem <enter>
            props.socket.emit('sendMsg', {
                msg: event.target.value,
                room: roomId
            })
            updateMessages.current = event.target.value+new Date()
            event.target.value = ''
        }
    }

    const renderContent = (msg) =>{
        if (msg.msgType === 'text') {
            return msg.message
        } else {
            return <audio src={msg.message} controls></audio>
        }
    }

    const renderMessage =(msg) => {
        return (
            <div className="message" key={msg._id}>
                <span className="author">{msg.author}</span>
                <br />
                <span className="msg-body">{renderContent(msg)} </span>
            </div>
        )
    }

        const room = roomId
        const msgs = props.msgs[room]

        return (
            <div className="room">
                <div className="messages">
                    {
                        msgs && msgs.map(renderMessage)
                    }
                </div>
                <div className="new-message-form w-form">
                    <form className="form">
                        <textarea id="field" className="field msg w-input" maxLength="5000" placeholder="Digite sua mensagem e pressione &lt;Enter&gt;" autoFocus onKeyUp={handleKey} /*ref={(ref) => this.msg = ref}*/></textarea>
                        <button type="button" className="send-audio w-button" onMouseDown={mouseDown} onMouseUp={mouseUp}>Enviar<br />Áudio</button>
                    </form>
                </div>
            </div>
        )
    
}

export default Room
