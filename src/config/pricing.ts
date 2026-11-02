// Konfigurasi Paket & Harga Resmi Bunda Journal (Single Source of Truth)
// PRD 1.4: Essential Rp 49.000, Upgrade VIP Rp 80.000 (VIP Total Rp 129.000), Hardcover Rp 249.000 (Cetak Fisik)

export interface PlanConfig {
  id: 'essential' | 'vip' | 'hardcover' | 'upgrade_vip';
  name: string;
  price: number;
  label: string;
  badge?: string;
  adminFeeText: string;
  desc: string;
}

export const PRICING_CONFIG: Record<'essential' | 'vip' | 'hardcover' | 'upgrade_vip', PlanConfig> = {
  essential: {
    id: 'essential',
    name: 'Essential Access',
    price: 49000,
    label: 'Rp 49.000',
    badge: 'Digital 30 Hal',
    adminFeeText: 'Gratis biaya admin (QRIS 0%)',
    desc: 'Akses penuh aplikasi Bunda Journal + Digital 30 Halaman.',
  },
  vip: {
    id: 'vip',
    name: 'VIP Bundle',
    price: 129000,
    label: 'Rp 129.000',
    badge: '100 Halaman + Voice QR',
    adminFeeText: 'Gratis biaya admin (QRIS 0%)',
    desc: 'Akses 100 halaman lengkap + 10 Voice QR suara detak jantung + grafik berat & tendangan + 3 template cetak.',
  },
  upgrade_vip: {
    id: 'upgrade_vip',
    name: 'Upgrade ke VIP',
    price: 80000,
    label: 'Rp 80.000',
    badge: '+Rp 80rb',
    adminFeeText: 'Gratis biaya admin (QRIS 0%)',
    desc: 'Bunda Essential tambah Rp 80rb untuk akses VIP 100 Halaman + Voice QR penuh.',
  },
  hardcover: {
    id: 'hardcover',
    name: 'Hardcover Cetak Fisik',
    price: 249000,
    label: 'Rp 249.000',
    badge: 'Cetak Fisik',
    adminFeeText: 'Gratis biaya admin (QRIS 0%)',
    desc: 'Buku hardcover linen mewah 100 halaman B5 dicetak fisik dan dikirim ke rumah.',
  },
};
