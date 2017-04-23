import fs from 'fs'

export const PORT = process.env.PORT || 8080
export const SECRET = process.env.SECRET

export const getHttpsOptions = () => ({
  key: fs.readFileSync('/etc/letsencrypt/live/yololo.gq/privkey.pem'),
  cert: fs.readFileSync('/etc/letsencrypt/live/yololo.gq/fullchain.pem'),
  ca: fs.readFileSync('/etc/letsencrypt/live/yololo.gq/chain.pem'),
})
