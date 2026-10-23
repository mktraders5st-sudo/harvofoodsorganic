# Deploying Harvo Foods Organic

This site keeps orders and products in a SQLite database file, so it needs a server with a **persistent disk**: a small Linux VPS is ideal (e.g. DigitalOcean, Hetzner, Vultr, Contabo; 1 GB RAM is enough).

> **Not suitable as-is:** Vercel, Netlify and other serverless hosts delete files between requests, so orders would be lost. To use them, the database layer (`lib/server/db.ts`) must first be moved to a hosted database such as Postgres or Turso.

The steps below are for **Ubuntu 24.04**. Replace `harvofoods.com` with your domain.

---

## 1. Prepare the server

```bash
# Log in as root once, create a normal user, and use that from now on
adduser harvo && usermod -aG sudo harvo
su - harvo

sudo apt update && sudo apt upgrade -y
sudo apt install -y git nginx

# Node.js 24 LTS
curl -fsSL https://deb.nodesource.com/setup_24.x | sudo -E bash -
sudo apt install -y nodejs
node --version   # should print v24.x

# Firewall: allow only SSH and the website
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable
```

Point your domain's **A record** to the server's IP address at your domain registrar.

## 2. Get the code

The GitHub repository is private, so the server needs read access. The simplest safe way is a **deploy key** (read-only, for this repository only):

```bash
ssh-keygen -t ed25519 -C "harvo-server" -f ~/.ssh/harvo_deploy -N ""
cat ~/.ssh/harvo_deploy.pub
```

Copy the printed key → GitHub → repository **Settings → Deploy keys → Add deploy key** (leave "Allow write access" **off**). Then:

```bash
cat >> ~/.ssh/config <<'EOF'
Host github.com
  IdentityFile ~/.ssh/harvo_deploy
EOF

git clone git@github.com:mktraders5st-sudo/harvofoodsorganic.git ~/harvo
cd ~/harvo
```

## 3. Install, build and create your admin

```bash
npm ci
npm run build
npm run admin:create -- yourname     # choose a strong password (12+ characters)
```

The database is created at `~/harvo/data/harvo.db` the first time the site starts, filled with the starting product list. To keep it elsewhere, copy `.env.example` to `.env.local` and set `HARVO_DB_PATH`.

## 4. Keep it running with PM2

```bash
sudo npm install -g pm2
pm2 start npm --name harvo -- start      # runs on port 3000
pm2 save
pm2 startup                              # run the command it prints, so the site restarts after a reboot
```

Useful: `pm2 status`, `pm2 logs harvo`, `pm2 restart harvo`.

## 5. Nginx and HTTPS

```bash
sudo tee /etc/nginx/sites-available/harvo >/dev/null <<'EOF'
server {
    listen 80;
    server_name harvofoods.com www.harvofoods.com;

    client_max_body_size 1m;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        # Overwrite (don't append) so visitors can't fake their IP and dodge the rate limits
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
EOF
sudo ln -s /etc/nginx/sites-available/harvo /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl reload nginx

# Free HTTPS certificate (renews automatically)
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d harvofoods.com -d www.harvofoods.com
```

HTTPS is required: the admin login cookie is only sent over secure connections in production.

Open `https://harvofoods.com` (shop) and `https://harvofoods.com/admin` (admin).

## 6. Daily backups

The database holds every order. Back it up daily and copy backups off the server now and then.

```bash
mkdir -p ~/harvo-backups
crontab -e
```

Add this line (runs at 3:00 am every day, keeps the newest 30):

```
0 3 * * * cd /home/harvo/harvo && /usr/bin/npm run backup -- /home/harvo/harvo-backups >> /home/harvo/harvo-backups/backup.log 2>&1
```

**Restore** a backup: `pm2 stop harvo`, copy the backup file over `data/harvo.db` (and delete `data/harvo.db-wal` and `data/harvo.db-shm` if present), then `pm2 start harvo`.

## 7. Updating the site

After pushing changes to GitHub:

```bash
cd ~/harvo
git pull
npm ci
npm run build
pm2 restart harvo
```

Database changes in `db/migrations/` apply automatically on restart; orders and products are kept.

## Checklist before going live

- [ ] Real prices and stock set in `/admin/products` (starting stock is 50 per size)
- [ ] Example products reviewed (Mango, Banana and Orange Peel Powder, Mixed Herb Seasoning are examples)
- [ ] Social profile links added in `lib/data.ts` (`socialLinks`), if you have them
- [ ] Test order placed and seen in `/admin/orders`, then cancelled
- [ ] Backups running (`ls ~/harvo-backups` the next day)
