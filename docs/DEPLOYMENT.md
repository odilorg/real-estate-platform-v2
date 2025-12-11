# Deployment Guide

## Staging Environment

**URL:** https://staging.jahongir-app.uz
**Branch:** `develop`
**Auto-deploy:** ✅ Enabled via GitHub Actions

## GitHub Secrets Setup

To enable automated deployment, you need to add the following secrets to your GitHub repository:

### How to Add Secrets:

1. Go to your GitHub repository: `https://github.com/odilorg/real-estate-platform-v2`
2. Click on **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret** for each of the following:

### Required Secrets:

#### 1. `VPS_HOST`
```
62.72.22.205
```

#### 2. `VPS_PORT`
```
2222
```

#### 3. `VPS_USER`
```
root
```

#### 4. `VPS_SSH_KEY`
Copy the entire content of your SSH private key:
```bash
cat /home/odil/projects/id_rsa
```
Paste the entire output (including `-----BEGIN OPENSSH PRIVATE KEY-----` and `-----END OPENSSH PRIVATE KEY-----`)

#### 5. `DATABASE_URL`
```
postgresql://realestate_user:changeme_strong_password_123@localhost:5432/realestate_staging
```
⚠️ **IMPORTANT:** Change the password `changeme_strong_password_123` to a strong password!

To change the database password:
```bash
ssh -i /home/odil/projects/id_rsa -p 2222 root@62.72.22.205
sudo -u postgres psql
ALTER USER realestate_user WITH PASSWORD 'your_new_strong_password';
\q
```

Then update the DATABASE_URL secret with the new password.

#### 6. `JWT_SECRET`
Generate a random secret:
```bash
openssl rand -base64 32
```
Use the output as your JWT_SECRET.

---

## Deployment Workflow

### Automatic Deployment:
Every time you push to the `develop` branch, GitHub Actions will automatically:

1. ✅ Connect to VPS
2. ✅ Pull latest code
3. ✅ Install dependencies
4. ✅ Run database migrations
5. ✅ Build applications
6. ✅ Restart services with PM2

### Manual Deployment:
You can also trigger deployment manually:

1. Go to **Actions** tab in GitHub
2. Click on **Deploy to Staging** workflow
3. Click **Run workflow** → Select `develop` branch → **Run workflow**

---

## First Deployment

After setting up the secrets, trigger the first deployment:

1. Commit and push the workflow file to `develop`:
   ```bash
   git add .github/workflows/deploy-staging.yml docs/DEPLOYMENT.md
   git commit -m "feat: Add GitHub Actions deployment workflow for staging"
   git push origin develop
   ```

2. Watch the deployment progress:
   - Go to **Actions** tab in GitHub
   - Click on the running workflow
   - Monitor the deployment logs

3. Once complete, visit: https://staging.jahongir-app.uz

---

## Troubleshooting

### Check application status:
```bash
ssh -i /home/odil/projects/id_rsa -p 2222 root@62.72.22.205
pm2 list
pm2 logs realestate-staging-api
pm2 logs realestate-staging-web
```

### Restart applications:
```bash
ssh -i /home/odil/projects/id_rsa -p 2222 root@62.72.22.205
pm2 restart realestate-staging-api
pm2 restart realestate-staging-web
```

### Check Nginx:
```bash
ssh -i /home/odil/projects/id_rsa -p 2222 root@62.72.22.205
nginx -t
systemctl status nginx
```

### View logs:
```bash
# API logs
pm2 logs realestate-staging-api --lines 100

# Web logs
pm2 logs realestate-staging-web --lines 100

# Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log
```

---

## Environment Variables

### API (.env)
Located at: `/var/www/realestate-staging/apps/api/.env`

### Web (.env.local)
Located at: `/var/www/realestate-staging/apps/web/.env.local`

To update environment variables:
1. SSH into the server
2. Edit the files
3. Restart the applications with `pm2 restart all`

---

## Database Management

### Run migrations:
```bash
ssh -i /home/odil/projects/id_rsa -p 2222 root@62.72.22.205
cd /var/www/realestate-staging/packages/database
pnpm prisma migrate deploy
```

### Seed database:
```bash
cd /var/www/realestate-staging/packages/database
pnpm prisma db seed
```

### Access database:
```bash
sudo -u postgres psql realestate_staging
```

---

## Production Deployment (Future)

When ready for production:

1. Create similar workflow for `main` branch
2. Point to production domain: `jahongir-app.uz`
3. Use separate database: `realestate_production`
4. Update environment variables for production
