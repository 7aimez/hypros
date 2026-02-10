# Intall HyprOS

**Step by step instructions to successfully install HyprOs**

---

### Manual

1. Clone the git repo:

```bash
git clone https://github.com/7aimez/hypros.git
```

2. Move into folder with `cd hypros`
3. Deploy locally (or publicly)
4. Open in web browser, or use [hypros.pages.dev](https://hypros.pages.dev)

---

### Auto

To speed up the install process, run this code to do it for you:

```bash
mkdir hypros_install
cd hypros_install
curl -O https://raw.githubusercontent.com/7aimez/hypros/refs/heads/main/install/auto.sh
cd ..
source hypros_install/auto.sh
rmdir hypros_install
cd hypros
```
