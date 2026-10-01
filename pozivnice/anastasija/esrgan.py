# Real-ESRGAN 4x uvećanje slike na procesoru (bez GPU). Korišćeno za slika-gore.png i slika-dole.png.
# Priprema:  pip install torch --index-url https://download.pytorch.org/whl/cpu && pip install pillow numpy
# Modeli:    https://github.com/xinntao/Real-ESRGAN/releases  (RealESRGAN_x4plus.pth -> 23 bloka, RealESRGAN_x4plus_anime_6B.pth -> 6 blokova)
# Pokretanje: python esrgan.py RealESRGAN_x4plus.pth 23 ulaz.png izlaz.png
"""Real-ESRGAN (RRDBNet) 4x upscaler, CPU only. Usage: esrgan.py MODEL.pth NUM_BLOCKS in.png out.png [tile]"""
import sys, time
import numpy as np
import torch, torch.nn as nn, torch.nn.functional as F
from PIL import Image

torch.set_num_threads(4)


class ResidualDenseBlock(nn.Module):
    def __init__(self, nf=64, gc=32):
        super().__init__()
        self.conv1 = nn.Conv2d(nf, gc, 3, 1, 1)
        self.conv2 = nn.Conv2d(nf + gc, gc, 3, 1, 1)
        self.conv3 = nn.Conv2d(nf + 2 * gc, gc, 3, 1, 1)
        self.conv4 = nn.Conv2d(nf + 3 * gc, gc, 3, 1, 1)
        self.conv5 = nn.Conv2d(nf + 4 * gc, nf, 3, 1, 1)
        self.lrelu = nn.LeakyReLU(0.2, True)

    def forward(self, x):
        x1 = self.lrelu(self.conv1(x))
        x2 = self.lrelu(self.conv2(torch.cat((x, x1), 1)))
        x3 = self.lrelu(self.conv3(torch.cat((x, x1, x2), 1)))
        x4 = self.lrelu(self.conv4(torch.cat((x, x1, x2, x3), 1)))
        x5 = self.conv5(torch.cat((x, x1, x2, x3, x4), 1))
        return x5 * 0.2 + x


class RRDB(nn.Module):
    def __init__(self, nf, gc=32):
        super().__init__()
        self.rdb1 = ResidualDenseBlock(nf, gc)
        self.rdb2 = ResidualDenseBlock(nf, gc)
        self.rdb3 = ResidualDenseBlock(nf, gc)

    def forward(self, x):
        out = self.rdb3(self.rdb2(self.rdb1(x)))
        return out * 0.2 + x


class RRDBNet(nn.Module):
    def __init__(self, in_ch=3, out_ch=3, nf=64, nb=23, gc=32):
        super().__init__()
        self.conv_first = nn.Conv2d(in_ch, nf, 3, 1, 1)
        self.body = nn.Sequential(*[RRDB(nf, gc) for _ in range(nb)])
        self.conv_body = nn.Conv2d(nf, nf, 3, 1, 1)
        self.conv_up1 = nn.Conv2d(nf, nf, 3, 1, 1)
        self.conv_up2 = nn.Conv2d(nf, nf, 3, 1, 1)
        self.conv_hr = nn.Conv2d(nf, nf, 3, 1, 1)
        self.conv_last = nn.Conv2d(nf, out_ch, 3, 1, 1)
        self.lrelu = nn.LeakyReLU(0.2, True)

    def forward(self, x):
        feat = self.conv_first(x)
        feat = feat + self.conv_body(self.body(feat))
        feat = self.lrelu(self.conv_up1(F.interpolate(feat, scale_factor=2, mode='nearest')))
        feat = self.lrelu(self.conv_up2(F.interpolate(feat, scale_factor=2, mode='nearest')))
        return self.conv_last(self.lrelu(self.conv_hr(feat)))


def load(path, nb):
    net = RRDBNet(nb=nb)
    sd = torch.load(path, map_location='cpu', weights_only=True)
    sd = sd.get('params_ema', sd.get('params', sd))
    net.load_state_dict(sd, strict=True)
    return net.eval()


def run_tiled(net, x, tile, overlap=16):
    _, _, h, w = x.shape
    out = torch.zeros(1, 3, h * 4, w * 4)
    for y0 in range(0, h, tile):
        for x0 in range(0, w, tile):
            y1, x1 = min(y0 + tile, h), min(x0 + tile, w)
            py0, px0 = max(y0 - overlap, 0), max(x0 - overlap, 0)
            py1, px1 = min(y1 + overlap, h), min(x1 + overlap, w)
            t = net(x[:, :, py0:py1, px0:px1])
            oy, ox = (y0 - py0) * 4, (x0 - px0) * 4
            out[:, :, y0 * 4:y1 * 4, x0 * 4:x1 * 4] = t[:, :, oy:oy + (y1 - y0) * 4, ox:ox + (x1 - x0) * 4]
    return out


def upscale(net, img, pad=10, tile=0):
    x = torch.from_numpy(np.asarray(img.convert('RGB'))).permute(2, 0, 1).float().unsqueeze(0) / 255.0
    x = F.pad(x, (pad, pad, pad, pad), mode='reflect')
    with torch.no_grad():
        y = net(x) if tile == 0 else run_tiled(net, x, tile)
    y = y[:, :, pad * 4:y.shape[2] - pad * 4, pad * 4:y.shape[3] - pad * 4]
    arr = (y.squeeze(0).permute(1, 2, 0).clamp(0, 1).numpy() * 255).round().astype(np.uint8)
    return Image.fromarray(arr)


if __name__ == '__main__':
    model, nb, src, dst = sys.argv[1], int(sys.argv[2]), sys.argv[3], sys.argv[4]
    tile = int(sys.argv[5]) if len(sys.argv) > 5 else 0
    t = time.time()
    net = load(model, nb)
    img = Image.open(src)
    out = upscale(net, img, tile=tile)
    out.save(dst)
    print(f'{src} {img.size} -> {dst} {out.size} za {time.time() - t:.0f}s')
