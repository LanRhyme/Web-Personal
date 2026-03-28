import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'fs'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    vue(),
    {
      name: 'local-upload-server',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.method === 'POST' && req.url === '/api/upload') {
            let body = ''
            req.on('data', chunk => {
              body += chunk.toString()
            })
            req.on('end', () => {
              try {
                const { filepath, content } = JSON.parse(body)
                if (!filepath || !content) {
                  res.statusCode = 400
                  res.end('Missing filepath or content')
                  return
                }
                
                // Security check: ensure path is within public directory
                const rootDir = process.cwd()
                const publicDir = path.join(rootDir, 'public')
                const cleanFilepath = filepath.replace(/^[/\\]/, '').replace(/\.\./g, '')
                const targetPath = path.join(publicDir, cleanFilepath)
                
                if (!targetPath.startsWith(publicDir)) {
                  res.statusCode = 403
                  res.end('Access denied')
                  return
                }

                // Ensure directory exists
                const dir = path.dirname(targetPath)
                if (!fs.existsSync(dir)) {
                  fs.mkdirSync(dir, { recursive: true })
                }

                // Write file (remove base64 header if present)
                const base64Data = content.replace(/^data:image\/\w+;base64,/, "")
                fs.writeFileSync(targetPath, base64Data, 'base64')
                
                console.log(`[Upload] Saved file to ${targetPath}`)
                
                res.setHeader('Content-Type', 'application/json')
                res.statusCode = 200
                res.end(JSON.stringify({ success: true, path: cleanFilepath }))
              } catch (e) {
                console.error('[Upload] Error:', e)
                res.statusCode = 500
                res.end(JSON.stringify({ error: 'Server error' }))
              }
            })
          } else {
            next()
          }
        })
      }
    }
  ],
})
