import React, { useEffect, useState } from 'react'
import axios from 'axios'
import './App.css'

export default function App() {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const hasDiscordAccessToken = localStorage.getItem('discord_access_token')
    if (hasDiscordAccessToken) {
      signInWithDiscord(hasDiscordAccessToken)
    }
  }, [])

  useEffect(() => {
    const url = window.location.href
    const hasDiscordToken = url.includes('?code=')

    if (hasDiscordToken) {
      const [urlWithoutCode, discordCode] = url.split('?code=')

      window.history.pushState({}, "", urlWithoutCode);

      getAuthTokens(discordCode)
    }
  }, [])

  const getAuthTokens = async (discordAuthCode) => {
    const params = new URLSearchParams()
    params.append('client_id', import.meta.env.VITE_CLIENT_ID_DISCORD)
    params.append('client_secret', import.meta.env.VITE_SECRET_DISCORD)
    params.append('grant_type', 'authorization_code')
    params.append('code', discordAuthCode)
    params.append('redirect_uri', import.meta.env.VITE_REDIRECT_URL)

    const responseDiscord = await axios.post('https://discord.com/api/oauth2/token',
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      })
    const { access_token, refresh_token } = responseDiscord.data

    localStorage.setItem('discord_access_token', access_token)
    localStorage.setItem('discord_refresh_token', refresh_token)

    signInWithDiscord(access_token)
  }

  const signInWithDiscord = async (accessToken) => {
    try {
      const responseDiscordUser = await axios.get('https://discord.com/api/users/@me',
        {
          headers: {
            authorization: `Bearer ${accessToken}`
          }
        })
      const { avatar, email, id, username } = responseDiscordUser.data
      setUser({ avatar, email, id, username })
    } catch (error) {
      if (responseDiscord.status === 401) {
        getRefreshToken(localStorage.getItem('discord_refresh_token'))
      }
    }
  }

  const getRefreshToken = async (refreshToken) => {
    const params = new URLSearchParams()
    params.append('client_id', import.meta.env.VITE_CLIENT_ID_DISCORD)
    params.append('client_secret', import.meta.env.VITE_SECRET_DISCORD)
    params.append('grant_type', 'refresh_token')
    params.append('refresh_token', refreshToken)

    const responseRefreshTokenDiscord = axios.post('https://discord.com/api/oauth2/token',
      params,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        }
      }
    )
    const { access_token, refresh_token } = responseRefreshTokenDiscord.data

    localStorage.setItem('discord_access_token', access_token)
    localStorage.setItem('discord_refresh_token', refresh_token)
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('discord_access_token')
    localStorage.removeItem('discord_refresh_token')
  }

  return (
    <div className="wrapper">
      {user ? (
        <button
          onClick={logout}
          className='btnDiscord logout'>
          Desconectar
        </button>
      ) : (
        <a
          href={import.meta.env.VITE_URL_DISCORD}
          className='btnDiscord'>
          Continuar com o Discord
        </a>
      )}
      {user && (
        <div className="infoUser">
          <p>
            Seja bem-vindo(a) {user.username}
          </p>
        </div>
      )}
    </div>
  )
}