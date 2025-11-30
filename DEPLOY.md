# AWS EC2 デプロイ手順

## 前提条件
- AWS アカウント
- ドメイン名（オプション、IPアドレスでもアクセス可能）
- SSH クライアント

---

## 1. EC2インスタンスの作成

### AWS コンソールで設定
1. **EC2ダッシュボード** → **インスタンスを起動**
2. **AMI**: Ubuntu Server 22.04 LTS
3. **インスタンスタイプ**: t3.small 以上を推奨（t2.microでも動作可能）
4. **キーペア**: 新規作成またはに既存のものを選択
5. **セキュリティグループ**で以下のポートを開放:
   - SSH (22)
   - HTTP (80)
   - HTTPS (443)

---

## 2. EC2にSSH接続

```bash
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip
```

---

## 3. 必要なソフトウェアのインストール

```bash
# パッケージを更新
sudo apt update && sudo apt upgrade -y

# Dockerをインストール
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Docker Composeをインストール
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Gitをインストール
sudo apt install git -y

# 一度ログアウトして再ログイン（Dockerグループを反映）
exit
```

再度SSH接続：
```bash
ssh -i "your-key.pem" ubuntu@your-ec2-public-ip
```

---

## 4. プロジェクトをデプロイ

### 方法A: GitHubからクローン（推奨）

```bash
# GitHubにプッシュ済みの場合
git clone https://github.com/your-username/virtual-office.git
cd virtual-office
```

### 方法B: ローカルからSCPでアップロード

ローカルPCで実行：
```bash
# プロジェクトをEC2にアップロード
scp -i "your-key.pem" -r ./virtual-office ubuntu@your-ec2-public-ip:~/
```

---

## 5. 環境変数を設定

```bash
cd virtual-office

# .envファイルを作成
cat > .env << 'EOF'
# Frontend
NEXT_PUBLIC_SUPABASE_URL=https://cvgkroetygnvrjcfybnl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2Z2tyb2V0eWdudnJqY2Z5Ym5sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ0NjIzNTEsImV4cCI6MjA4MDAzODM1MX0.MVymm7qq6xtk2uM_6R72B1E8kkDulLreY2eFmSupCvQ
NEXT_PUBLIC_SOCKET_URL=http://YOUR_EC2_PUBLIC_IP

# Backend
PORT=3001
CORS_ORIGIN=http://YOUR_EC2_PUBLIC_IP
EOF

# YOUR_EC2_PUBLIC_IPを実際のIPアドレスに置き換え
# 例: sed -i 's/YOUR_EC2_PUBLIC_IP/54.123.45.67/g' .env
```

---

## 6. SSLディレクトリを作成

```bash
mkdir -p nginx/ssl
```

---

## 7. Dockerでビルド＆起動

```bash
# ビルドと起動
docker-compose up -d --build

# ログを確認
docker-compose logs -f
```

---

## 8. 動作確認

ブラウザで以下にアクセス：
```
http://YOUR_EC2_PUBLIC_IP
```

---

## オプション: ドメイン設定 & HTTPS化

### 1. ドメインのDNS設定
- Aレコードを追加: `@` → EC2のパブリックIP
- または: `www` → EC2のパブリックIP

### 2. Certbotでfで証明書を取得

```bash
# Certbotをインストール
sudo apt install certbot -y

# 一時的にnginxを停止
docker-compose stop nginx

# 証明書を取得
sudo certbot certonly --standalone -d your-domain.com

# 証明書をnginx/sslにコピー
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem nginx/ssl/
sudo chown ubuntu:ubuntu nginx/ssl/*
```

### 3. nginx.confを編集してHTTPSを有効化
nginx/nginx.confのHTTPS設定のコメントを解除

### 4. 環境変数を更新

```bash
# .envのURLをHTTPSに変更
sed -i 's/http:\/\/YOUR_EC2_PUBLIC_IP/https:\/\/your-domain.com/g' .env
```

### 5. 再起動

```bash
docker-compose down
docker-compose up -d --build
```

---

## トラブルシューティング

### ログを確認
```bash
docker-compose logs frontend
docker-compose logs backend
docker-compose logs nginx
```

### コンテナを再起動
```bash
docker-compose restart
```

### 全て作り直し
```bash
docker-compose down -v
docker-compose up -d --build
```

### ポートが使用中の場合
```bash
sudo lsof -i :80
sudo lsof -i :3000
sudo lsof -i :3001
```

---

## Supabaseの設定更新

本番URLをSupabaseに追加：

1. Supabaseダッシュボード → **Authentication** → **URL Configuration**
2. **Site URL**: `http://YOUR_EC2_PUBLIC_IP` または `https://your-domain.com`
3. **Redirect URLs** に追加: `http://YOUR_EC2_PUBLIC_IP/**`

---

## 更新時のデプロイ

```bash
cd virtual-office

# 最新コードを取得（GitHubの場合）
git pull

# 再ビルド＆再起動
docker-compose down
docker-compose up -d --build
```
