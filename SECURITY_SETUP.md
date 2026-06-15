# 🔒 SECURITY: GIT & ENVIRONMENT SETUP

## ✅ ENSURE .ENV FILES ARE NOT COMMITTED

### Backend Gitignore Check
```bash
cd BE_LMS

# Verify .env is in .gitignore
cat .gitignore | grep ".env"

# Should output: .env or .env*

# If not, add it:
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
```

### Frontend Gitignore Check
```bash
cd FE_LMS

# Verify .env is in .gitignore
cat .gitignore | grep ".env"

# If not, add it:
echo ".env" >> .gitignore
echo ".env.local" >> .gitignore
echo ".env.*.local" >> .gitignore
```

---

## 📝 CORRECT .GITIGNORE SETUP

### Backend (BE_LMS/.gitignore) - Should Include:
```gitignore
# Environment variables
.env
.env.local
.env.*.local
.env.production

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build
dist/
coverage/
.nyc_output/

# IDE
.vscode/
.idea/
*.sublime-workspace
*.swp

# OS
.DS_Store
Thumbs.db
```

### Frontend (FE_LMS/.gitignore) - Should Include:
```gitignore
# Environment variables
.env
.env.local
.env.*.local
.env.production

# Node
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Build
dist/
dist-server/
*.local

# IDE
.vscode/
.idea/
*.sublime-workspace
*.swp

# OS
.DS_Store
Thumbs.db
```

---

## 🚨 IF YOU ACCIDENTALLY COMMITTED .ENV

### Immediately Remove Secret
1. Rotate all secrets (JWT, API keys, etc.)
2. Delete the commit from history

```bash
# Option 1: If you haven't pushed yet
git reset HEAD~1  # Undo the commit but keep files
git reset --hard HEAD~1  # Also remove files

# Option 2: If you already pushed (more complex)
git filter-branch --tree-filter 'rm -f .env' HEAD
git push --force-with-lease
```

3. Remove file from git history:
```bash
git rm --cached .env
git commit --amend -m "Remove .env file"
git push
```

4. Generate new secrets and update everywhere

---

## 📋 ENVIRONMENT FILE CHECKLIST

### Backend Files
- [ ] `.env.example` - Template for developers (COMMITTED)
- [ ] `.env.development` - Local development (COMMITTED - safe defaults)
- [ ] `.env.production.example` - Template for production (COMMITTED)
- [ ] `.env` - Local secrets (NOT COMMITTED)
- [ ] `.env.production` - Production secrets (NOT COMMITTED)

### Frontend Files
- [ ] `.env.example` - Template (COMMITTED)
- [ ] `.env.development` - Local dev (COMMITTED - safe defaults)
- [ ] `.env.production` - Production (COMMITTED - uses safe values)
- [ ] `.env` - Local overrides (NOT COMMITTED)

---

## 🔐 SECRETS HIERARCHY

### What Gets Committed (PUBLIC, SAFE)
```
✅ .env.example         - Structure only
✅ .env.development     - Non-secret default values
✅ .env.production.example - Structure only
✅ GOOGLE_CLIENT_ID    - Public key, intended to be public
```

### What NEVER Gets Committed (SECRET)
```
❌ .env                - Your local secrets
❌ JWT_SECRET          - Must be unique for each environment
❌ GOOGLE_CLIENT_SECRET - Must stay hidden
❌ MINIO_SECRET_KEY    - Must stay hidden
❌ RESEND_API_KEY      - Must stay hidden
❌ MONGO_URI password  - Must stay hidden
❌ Any real API keys   - Must stay hidden
```

---

## 🛡️ GITHUB SECRET SCANNING

GitHub automatically scans for:
- AWS keys
- API keys
- Private keys
- Database credentials

If detected:
1. You get an email from GitHub
2. Immediately rotate those secrets
3. GitHub may disable the key

---

## ⚙️ VERIFYING BEFORE PUSH

```bash
# Check what will be committed
git status

# Should NOT show:
# - .env
# - .env.production
# - Private key files

# Preview what's being committed
git diff --cached

# If wrong files, unstage:
git reset HEAD <filename>
```

---

## 🔑 MANAGING SECRETS IN RENDER & VERCEL

### ✅ Correct Way: Environment Variables

**Render**:
1. Dashboard → Web Service → Environment
2. Add each secret there
3. Never in code, never in git
4. Render doesn't log these values

**Vercel**:
1. Settings → Environment Variables
2. Add each secret there
3. Render once at build time
4. Check "Sensitive" checkbox

### ❌ Wrong Way: Hardcoding
```javascript
// NEVER DO THIS:
const JWT_SECRET = "my-secret-key";
const API_KEY = "abc123";
```

---

## 📚 REFERENCE: ENVIRONMENT VARIABLE NAMING

### Vercel (Frontend)
Prefix with `VITE_`:
```
VITE_BASE_API=...
VITE_GOOGLE_CLIENT_ID=...
```

### Render (Backend)
No special prefix needed:
```
MONGO_URI=...
JWT_SECRET=...
```

---

## 🧪 TEST BEFORE DEPLOYMENT

```bash
# Make sure secrets aren't in git
git log --all --full-history -S "JWT_SECRET" --oneline

# If found, STOP and fix before deploying

# Check .gitignore is working
git ls-files | grep .env

# Should return nothing if .env properly ignored
```

---

## ✨ FINAL SECURITY CHECKLIST

- [ ] .env in .gitignore
- [ ] .env files never committed
- [ ] No secrets in code
- [ ] No hardcoded API keys
- [ ] All secrets in Render environment
- [ ] All secrets in Vercel environment
- [ ] JWT_SECRET is unique
- [ ] No accidental pushes of secrets
- [ ] Regular rotation of API keys
- [ ] GitHub Secret Scanning enabled

