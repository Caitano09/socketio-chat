import React, { useState, useEffect, useRef } from 'react'
import io from 'socket.io-client'
import { Route, Link } from 'react-router-dom'
import Room from './Room'
import SelectRoom from './SelectRoom'

const Rooms = (props) => {
    const token = window.localStorage.getItem('token')
    const socket = io('http://localhost:3001?token=' + token)
    const [rooms, setRoom] = useState([])
    const [msgs, setMsg] = useState({})
    const roomId = useRef('')
    const refMsgs = useRef({})
    const refRooms = useRef([])
    const updateRooms = useRef(null)
    const updateMessages = useRef(null)

    useEffect(() => {

        //nova sala é adicionada
        socket.on('newRoom', room => {
            setRoom([...refRooms.current, room])
            updateRooms.current = ""+new Date()
        })

        // recebe a lista inicial de rooms
        socket.on('roomList', rooms => {
            setRoom(rooms)
            refRooms.current = rooms
        })

        socket.on('newMsg', msg => {
            if (!refMsgs.current[msg.room]) {
                const newMsgs = { ...refMsgs.current }
                newMsgs[msg.room] = [msg]
                setMsg(newMsgs)
                refMsgs.current = newMsgs
            } else {
                const newMsgs = { ...refMsgs.current }
                newMsgs[msg.room].push(msg)
                setMsg(newMsgs)
                refMsgs.current = newMsgs
            }
            //CAUTION
            if (msg.room !== roomId.current) {
                const room = rooms.find(room => room._id === msg.room)
                const ind = rooms.indexOf(room)
                const numRooms = [...rooms]
                if (!room.count) {
                    room.count = 0
                }
                room.count++
                numRooms[ind] = room
                setRoom(numRooms)
            }
            updateMessages.current = ""+new Date()
        })

        socket.on('newAudio', msg => {
            if (!refMsgs.current[msg.room]) {
                const newMsgs = { ...refMsgs.current }
                newMsgs[msg.room] = [msg]
                setMsg(newMsgs)
                refMsgs.current = newMsgs
            } else {
                const newMsgs = { ...refMsgs.current }
                newMsgs[msg.room].push(msg)
                setMsg(newMsgs)
                refMsgs.current = newMsgs
            }
            if (msg.room !== roomId.current) {
                const room = rooms.find(room => room._id === msg.room)
                const ind = rooms.indexOf(room)
                const numRooms = [...rooms]
                if (!room.count) {
                    room.count = 0
                }
                room.count++
                numRooms[ind] = room
                setRoom(numRooms)
            }
            updateMessages.current = ""+new Date()
        })

        socket.on('msgsList', msgs1 => {
            //console.log('msgs', msgs[Object.keys(msgs)[Object.keys(msgs).length - 1]].message)
            if (msgs1.length > 0) {
                const msgsTmp = { ...msgs1 }
                msgsTmp[msgs1[0].room] = msgs1
                refMsgs.current = msgsTmp
                setMsg(msgsTmp)


            }
        })
    }, [roomId.current, updateRooms.current, updateMessages.current]);


    const addNewRoom = () => {
        const roomName = prompt('Informe o nome da sala')
        if (roomName) {
            socket.emit('addRoom', roomName)
        }
    }

    const setNewRoom = (newRoomId) => {

        if (typeof (newRoomId) === 'string') {
            roomId.current = newRoomId
        } else if (typeof (newRoomId) === 'object') {
            roomId.current = newRoomId.target.name
        }

        const room = rooms.find(room => room._id === roomId.current)
        if (room) {
            const ind = rooms.indexOf(room)

            const newRooms = [...rooms]
            if (room.count) {
                room.count = 0
            }
            newRooms[ind] = room
            setRoom(newRooms)
        }
    }
    return (
        <div className="container w-container">
            <div className="rooms">
                <h1 className="title-rooms">Salas Disponíveis</h1>
                <ul className="room-list w-list-unstyled">
                    {
                        rooms.map(room => {
                            return (
                                <li className="room-item" key={room._id} >

                                    <Link to={`/rooms/${room._id}`} name={room._id} onClick={setNewRoom} >

                                        {room._id === roomId.current && ' >> '} {room.name} {!!room.count && <span>({room.count})</span>}
                                    </Link>
                                </li>
                            )
                        })

                    }
                </ul>
                <div className="add-room" onClick={addNewRoom}>+</div>
            </div>

            <Route path='/rooms' exact component={SelectRoom} />
            <Route path='/rooms/:room' render={(props) => <Room {...props} socket={socket} msgs={msgs} setNewRoom={setNewRoom} roomId={roomId} />} />

        </div>
    )

}

export default Rooms