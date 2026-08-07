# Deploying The Balcony House

One-time setup to get this running on a real domain, for free (aside from the
domain itself), with auto-deploy on every push to `main`. Do these once; after
that, `git push` to `main` is the entire release process.

## 1. Provision the free Oracle Cloud VM

1. Create an account at [cloud.oracle.com](https://cloud.oracle.com) (a card
   is required for identity verification only — the Always Free shapes below
   are never billed).
2. Create a Compute instance using an **Always Free** shape: prefer
   **VM.Standard.A1.Flex** (Ampere/ARM, up to 4 OCPU / 24GB — comfortably
   covers Postgres + Redis + the backend + Caddy). Ubuntu 22.04 or later is a
   safe image choice.
   - If instance creation fails with an "Out of host capacity" error, that's a
     known, widely-reported Oracle free-tier issue — retry (sometimes a few
     times over a day or two), or try a different Availability Domain. If it's
     too much friction, the two **Always Free "Micro" (VM.Standard.E2.1.Micro)**
     AMD shapes don't have this problem, just less headroom (1 OCPU/1GB each).
3. When creating the instance, download the generated SSH key pair (or attach
   your own public key) — you'll need this to log in.
4. Note the instance's public IP address.

## 2. Open ports 80 and 443

Oracle blocks inbound traffic at the cloud network level *in addition to* the
instance's own firewall — both need to allow it, or the app will be
unreachable even though everything inside the VM looks fine:

1. In the Oracle console: the instance's **Subnet → Security List** (or a
   Network Security Group if you used one) → **Add Ingress Rules** → allow
   TCP 80 and TCP 443 from `0.0.0.0/0`.
2. On the VM itself (SSH in first): Ubuntu images ship with `iptables`
   pre-configured to also block these by default —
   `sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT`
   and the same for `443`, then persist with
   `sudo netfilter-persistent save` (install `iptables-persistent` if needed).

## 3. Point a domain at the VM

1. Register a domain from a low-cost registrar (Porkbun, Namecheap — a `.com`
   is typically $10-15/year).
2. In the registrar's DNS settings, add an **A record** for the domain (and
   `www` if you want that to work too) pointing at the VM's public IP. DNS
   propagation can take a few minutes to a few hours.

## 4. Register the OAuth redirect URI

In [Google Cloud Console](https://console.cloud.google.com) → APIs & Services
→ Credentials → your existing OAuth 2.0 Client ID → **Authorized redirect
URIs** → add:

```
https://yourdomain.com/login/oauth2/code/google
```

(Keep the existing `http://localhost:8080/...` one too — that's what local
dev still uses.)

## 5. One-time server setup

SSH into the VM, then:

```bash
# Docker + Compose plugin
curl -fsSL https://get.docker.com | sudo sh
sudo usermod -aG docker $USER
# log out and back in for the group change to take effect

# Clone the repo
git clone https://github.com/<you>/balcony-house.git
cd balcony-house

# Real production secrets - see .env.production.example for what each var means
cp .env.production.example .env
nano .env   # fill in SITE_ADDRESS, POSTGRES_PASSWORD, GOOGLE_CLIENT_ID/SECRET, ADMIN_EMAILS

# First deploy (subsequent ones happen automatically via GitHub Actions)
docker compose -f docker-compose.yml -f docker-compose.prod.yml up --build -d
```

Caddy will automatically request and renew an HTTPS certificate for
`SITE_ADDRESS` the first time it starts — give it a minute, then visit
`https://yourdomain.com`.

## 6. Wire up auto-deploy from GitHub

1. Generate a dedicated deploy key pair (don't reuse your personal one):
   `ssh-keygen -t ed25519 -f deploy_key -N ""`
2. Add `deploy_key.pub`'s contents to the VM's `~/.ssh/authorized_keys`.
3. In the GitHub repo → Settings → Secrets and variables → Actions, add:
   - `DEPLOY_HOST` — the VM's public IP or domain
   - `DEPLOY_USER` — the SSH user (e.g. `ubuntu`)
   - `DEPLOY_SSH_KEY` — the *private* key contents (`deploy_key`, not `.pub`)
   - `DEPLOY_PATH` — the absolute path to the cloned repo on the VM (e.g.
     `/home/ubuntu/balcony-house`)

From here on, every push to `main` runs `.github/workflows/deploy.yml`, which
SSHes in, `git pull`s, and re-runs `docker compose ... up --build -d` — the
same command from step 5, just triggered automatically instead of by hand.

## Notes

- Postgres and Redis are not exposed on the host in production
  (`docker-compose.prod.yml` intentionally omits their port mappings) — only
  Caddy (80/443) is reachable from outside.
- Caddy's certificate data lives in the `caddy_data`/`caddy_config` named
  Docker volumes, so redeploys don't lose the certificate or trigger a new
  Let's Encrypt issuance every time.
- To roll back, `git revert` the bad commit and push — the same pipeline
  redeploys the reverted state.
