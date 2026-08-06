import axios from 'axios'

// The backend issues:
//  - an HttpOnly session cookie (BALCONYSESSION) - never readable by JS, holds auth state
//  - a readable XSRF-TOKEN cookie - echoed back as a header on state-changing requests
// `withCredentials: true` makes the browser send/receive both automatically.
const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
})

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.dispatchEvent(new CustomEvent('balconyhouse:session-expired'))
    }
    return Promise.reject(error)
  }
)

export default apiClient
