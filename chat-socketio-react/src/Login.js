import React, { useState } from 'react'
import axios from 'axios'
import { Redirect } from 'react-router-dom'

const Login = () => {
    const [success, setSuccess] = useState(false)

    const handleSubmit = (e) => {
        axios.post('http://localhost:3001/auth', {
            name: e.target.name.value
        }).then(out => {
            const token = out.data.token
            window.localStorage.setItem('token', token)
            setSuccess(true)
        })
        e.preventDefault()
    }

    if (success) {
        return <Redirect to='/rooms' />
    }
    return (
        <div className="container-2 w-container">
            <form className="lobby" method="POST" onSubmit={handleSubmit}>
                <h1 className="heading">Seja bem-vindo</h1>
                <div>Informe seu nome para começar:</div>
                <input className="div-block-3" name="name" style={{ width: '100%' }} /><br />
                <input type="submit" className="w-button" value="Entrar" />
            </form>
        </div>
    )

}

export default Login
