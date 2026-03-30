const API_URL = import.meta.env.VITE_API_BASE || '/api'

const parseResponse = async (response) => {
  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  const text = await response.text()
  return text ? { message: text } : null
}

export const api = {
  async request(endpoint, method = 'GET', body = null, token = null) {
    const headers = {
      'Content-Type': 'application/json',
    }

    const authToken = token || localStorage.getItem('token')
    if (authToken) {
      headers['x-auth-token'] = authToken
    }

    const config = {
      method,
      headers,
      credentials: 'include',
    }

    if (body) {
      config.body = JSON.stringify(body)
    }

    try {
      const response = await fetch(`${API_URL}${endpoint}`, config)
      const data = await parseResponse(response)

      if (!response.ok) {
        throw new Error(data?.message || 'Si e verificato un errore')
      }

      return data
    } catch (error) {
      throw error
    }
  },

  post(endpoint, body, token = null) {
    return this.request(endpoint, 'POST', body, token)
  },

  get(endpoint, token = null) {
    return this.request(endpoint, 'GET', null, token)
  },
}
