import React from 'react';
import { Document, Page, View, Text, StyleSheet, Image } from '@react-pdf/renderer';
import { getWeekData } from '../data/pregnancyWeeks';
import { UserProfile, PhotoMemory, JournalEntry } from '../types';
import { BookThemeConfig } from '../types/bookPrint';

// ============================================================================
// STYLESHEET (Native B5: 176mm x 250mm / 498.9pt x 708.66pt)
// Clean Editorial Aesthetics: Matching PrintBookStudio Studio UI
// Warm Linen Paper (#FAF9F7), Olive (#556B2F), Terracotta (#C87A64), Border (#D6D3D1)
// ============================================================================
const styles = StyleSheet.create({
  page: {
    paddingTop: 22,
    paddingBottom: 20,
    paddingLeft: 24,
    paddingRight: 24,
    backgroundColor: '#FAF9F7',
    fontFamily: 'Helvetica',
    color: '#1C1917',
    flexDirection: 'column',
    justifyContent: 'space-between',
    fontSize: 8.5,
    lineHeight: 1.4,
  },
  // Outer decorative book frame
  pageBorderFrame: {
    position: 'absolute',
    top: 12,
    left: 14,
    right: 14,
    bottom: 12,
    borderWidth: 0.75,
    borderColor: '#D6D3D1',
  },
  innerPageContainer: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
  },

  // --------------------------------------------------------------------------
  // TOP HEADER BANNER (Card-like Header in Studio)
  // --------------------------------------------------------------------------
  topHeaderBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderBottomWidth: 1.5,
    borderBottomColor: '#1C1917',
    paddingBottom: 4,
    marginBottom: 7,
  },
  topHeaderCategory: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: '#78716C',
    marginBottom: 1,
  },
  topHeaderTitle: {
    fontFamily: 'Times-Bold',
    fontSize: 16,
    color: '#1C1917',
    letterSpacing: -0.2,
  },
  topHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 0.75,
    borderColor: '#D6D3D1',
    borderRadius: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  topHeaderBadgeText: {
    fontFamily: 'Helvetica',
    fontSize: 7.5,
    color: '#44403C',
  },
  topHeaderBadgeAccent: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: '#556B2F',
    marginLeft: 3,
  },

  // --------------------------------------------------------------------------
  // CARDS & BOX COMPONENTS (Mirrors Studio Cards)
  // --------------------------------------------------------------------------
  cardContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.75,
    borderColor: '#D6D3D1',
    borderRadius: 3,
    marginBottom: 6,
    overflow: 'hidden',
  },
  cardHeader: {
    backgroundColor: '#F2EFE9',
    borderBottomWidth: 0.75,
    borderBottomColor: '#D6D3D1',
    paddingVertical: 3,
    paddingHorizontal: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.2,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: '#1C1917',
  },
  cardHeaderSubtext: {
    fontFamily: 'Helvetica',
    fontSize: 6.8,
    color: '#78716C',
  },
  cardBody: {
    padding: 6,
  },

  // Highlight / Milestone Banner Card
  milestoneCard: {
    backgroundColor: '#F3F5EE',
    borderWidth: 0.75,
    borderColor: '#D4DEC3',
    borderRadius: 3,
    paddingVertical: 5,
    paddingHorizontal: 8,
    marginBottom: 6,
    textAlign: 'center',
  },
  milestoneTitle: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: '#556B2F',
    textAlign: 'center',
    marginBottom: 2,
  },
  milestoneQuote: {
    fontFamily: 'Times-Italic',
    fontSize: 9,
    color: '#292524',
    textAlign: 'center',
    lineHeight: 1.35,
  },

  // --------------------------------------------------------------------------
  // DAILY JOURNAL ENTRIES (Senin - Minggu Rows)
  // --------------------------------------------------------------------------
  dailyRowsContainer: {
    paddingVertical: 3,
    paddingHorizontal: 5,
  },
  dailyRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E7E5E4',
    paddingVertical: 2.2,
  },
  dayBadge: {
    width: 22,
    paddingVertical: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayBadgeText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.2,
    color: '#78716C',
    textTransform: 'uppercase',
  },
  dayBadgeTextSunday: {
    color: '#C87A64',
  },
  dailyText: {
    flex: 1,
    fontFamily: 'Times-Italic',
    fontSize: 7.8,
    color: '#292524',
    paddingLeft: 4,
    lineHeight: 1.3,
  },

  // --------------------------------------------------------------------------
  // 3-COLUMN METRICS (Berat, Lingkar Perut, Tekanan Darah)
  // --------------------------------------------------------------------------
  metricsGrid3: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  metricCard: {
    width: '32%',
    backgroundColor: '#FFFFFF',
    borderWidth: 0.75,
    borderColor: '#D6D3D1',
    borderRadius: 3,
    overflow: 'hidden',
  },
  metricHeader: {
    backgroundColor: '#F2EFE9',
    borderBottomWidth: 0.75,
    borderBottomColor: '#D6D3D1',
    paddingVertical: 2,
    alignItems: 'center',
  },
  metricHeaderText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 6.8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    color: '#44403C',
  },
  metricBody: {
    paddingVertical: 3.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontFamily: 'Times-Bold',
    fontSize: 10,
    color: '#1C1917',
  },

  // --------------------------------------------------------------------------
  // POLAROID PHOTO FRAME (Studio Washi-Tape Style)
  // --------------------------------------------------------------------------
  polaroidContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 0.75,
    borderColor: '#D6D3D1',
    padding: 5,
    borderRadius: 2,
    marginBottom: 6,
    alignItems: 'center',
    position: 'relative',
  },
  washiTape: {
    width: 48,
    height: 8,
    backgroundColor: 'rgba(200, 122, 100, 0.45)',
    marginBottom: 3,
    borderRadius: 1,
  },
  polaroidImageHolder: {
    width: '100%',
    height: 98,
    backgroundColor: '#F5F5F4',
    borderWidth: 0.75,
    borderColor: '#E7E5E4',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  polaroidImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
  polaroidCaption: {
    fontFamily: 'Times-Italic',
    fontSize: 7.5,
    color: '#57534E',
    marginTop: 3,
    textAlign: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: '#E7E5E4',
    paddingBottom: 1,
    width: '90%',
  },

  // --------------------------------------------------------------------------
  // HEALTH CHECKLIST & TRACKER TABLES
  // --------------------------------------------------------------------------
  trackerGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  trackerCol: {
    width: '48.5%',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 2,
    borderBottomWidth: 0.5,
    borderBottomColor: '#F5F5F4',
  },
  tableRowLabel: {
    fontFamily: 'Helvetica',
    fontSize: 7.5,
    color: '#44403C',
  },
  tableRowValue: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: '#1C1917',
  },
  checkPillActive: {
    backgroundColor: '#EBF1E5',
    borderWidth: 0.5,
    borderColor: '#C3D6B5',
    borderRadius: 2,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  checkPillText: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 6.8,
    color: '#556B2F',
  },

  // --------------------------------------------------------------------------
  // COVER STYLES
  // --------------------------------------------------------------------------
  coverDoubleBorder: {
    flex: 1,
    borderWidth: 2,
    borderColor: '#556B2F',
    padding: 20,
    justifyContent: 'space-between',
    alignItems: 'center',
    textAlign: 'center',
  },
  coverTitleLockup: {
    alignItems: 'center',
    marginVertical: 'auto',
  },
  coverLogoText: {
    fontFamily: 'Times-Bold',
    fontSize: 48,
    color: '#1C1917',
    letterSpacing: -1,
    marginBottom: 4,
  },
  coverSubtitle: {
    fontFamily: 'Times-Italic',
    fontSize: 13,
    color: '#C87A64',
    textAlign: 'center',
    marginBottom: 8,
  },
  coverDescription: {
    fontFamily: 'Helvetica',
    fontSize: 8.5,
    color: '#57534E',
    textAlign: 'center',
    maxWidth: 240,
    lineHeight: 1.45,
  },
  coverOwnerCard: {
    width: '84%',
    backgroundColor: '#FFFFFF',
    borderWidth: 0.75,
    borderColor: '#D6D3D1',
    borderRadius: 3,
    paddingVertical: 8,
    paddingHorizontal: 12,
    alignItems: 'center',
    marginVertical: 14,
  },

  // --------------------------------------------------------------------------
  // FOOTER
  // --------------------------------------------------------------------------
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 0.75,
    borderTopColor: '#D6D3D1',
    paddingTop: 4,
    marginTop: 4,
  },
  footerPageNum: {
    fontFamily: 'Helvetica-Bold',
    fontSize: 7.5,
    color: '#44403C',
  },
  footerBookTitle: {
    fontFamily: 'Helvetica',
    fontSize: 7,
    letterSpacing: 0.5,
    color: '#A8A29E',
  },
  footerChapter: {
    fontFamily: 'Times-Italic',
    fontSize: 7.5,
    color: '#78716C',
  },
});

export interface PdfBookPageData {
  spreadIndex: number;
  leftPageNum: number;
  rightPageNum: number;
  type: string;
  chapterTitle: string;
  week?: number;
}

export interface JournalPdfDocumentProps {
  bookPages?: PdfBookPageData[];
  userProfile?: UserProfile;
  activeTheme?: BookThemeConfig;
  photos?: PhotoMemory[];
  pastEntries?: JournalEntry[];
  customPhotos?: Record<number, PhotoMemory>;
  currentWeek?: number;
}

// Helper to safely load LocalStorage data (browser environment fallback)
function getSavedStorage(key: string): any {
  if (typeof window === 'undefined') return null;
  try {
    const s = localStorage.getItem(key);
    return s ? JSON.parse(s) : null;
  } catch {
    return null;
  }
}

export const JournalPdfDocument: React.FC<JournalPdfDocumentProps> = ({
  bookPages,
  userProfile,
  activeTheme,
  photos = [],
  pastEntries = [],
  customPhotos = {},
  currentWeek = 12,
}) => {
  const bab1Data = getSavedStorage('bunda_bab1');
  const bab3Data = getSavedStorage('bunda_bab3');
  const bab4Data = getSavedStorage('bunda_bab4');
  const bab5Data = getSavedStorage('bunda_bab5');

  const ownerName = userProfile?.name || 'Jessica Alana';
  const hplDate = userProfile?.hplDate || '18 Mei 2025';
  const babyNickname = userProfile?.babyNickname || 'Kalandra';

  // Standard 50 spreads = 100 pages
  const spreadsToRender = bookPages && bookPages.length > 0 
    ? bookPages 
    : Array.from({ length: 50 }).map((_, i) => ({
        spreadIndex: i,
        leftPageNum: i * 2 + 1,
        rightPageNum: i * 2 + 2,
        type: i === 0 ? 'intro' : i === 1 ? 'bab1-a' : i === 2 ? 'bab1-b' : i === 3 ? 'pembatas-1' : 'other',
        chapterTitle: `Lembar ${i + 1}`,
      }));

  return (
    <Document
      title="Bunda-Journal"
      author="bunda."
      subject="Buku Jurnal Kehamilan 100 Halaman Ukuran Presisi B5"
      creator="Bunda Print Studio"
    >
      {spreadsToRender.map((spread) => {
        const sIdx = spread.spreadIndex;
        const leftNum = spread.leftPageNum || sIdx * 2 + 1;
        const rightNum = spread.rightPageNum || sIdx * 2 + 2;

        // --------------------------------------------------------------------
        // SPREAD 0: HALAMAN 1 & 2 (Cover / Title & Prakata)
        // --------------------------------------------------------------------
        if (sIdx === 0) {
          return (
            <React.Fragment key={`spread-${sIdx}`}>
              {/* HALAMAN 1: COVER UTAMA */}
              <Page size="B5" style={styles.page}>
                <View style={styles.pageBorderFrame} />
                <View style={styles.coverDoubleBorder}>
                  <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.topHeaderCategory, { fontSize: 7.5, letterSpacing: 2 }]}>
                      JURNAL KEHAMILAN & BUKU KENANGAN 100 HALAMAN
                    </Text>
                    <View style={{ width: 36, height: 1.5, backgroundColor: '#556B2F', marginTop: 4 }} />
                  </View>

                  <View style={styles.coverTitleLockup}>
                    <Text style={styles.coverLogoText}>bunda.</Text>
                    <Text style={styles.coverSubtitle}>Abadikan Perjalanan 9 Bulan yang Magis</Text>
                    <Text style={styles.coverDescription}>
                      Catatan cinta, detak rasa, dan untaian doa dari setiap minggu penantian terindah sang buah hati.
                    </Text>
                  </View>

                  <View style={styles.coverOwnerCard}>
                    <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 7, color: '#78716C', marginBottom: 2 }}>
                      BUKU MILIK:
                    </Text>
                    <Text style={{ fontFamily: 'Times-Bold', fontSize: 13, color: '#1C1917', marginBottom: 3 }}>
                      {ownerName}
                    </Text>
                    <View style={{ width: 120, height: 0.5, backgroundColor: '#D6D3D1', marginBottom: 4 }} />
                    <Text style={{ fontFamily: 'Helvetica', fontSize: 7.5, color: '#57534E' }}>
                      Perkiraan Lahir (HPL): <Text style={{ fontFamily: 'Helvetica-Bold' }}>{hplDate}</Text>
                    </Text>
                  </View>

                  <View>
                    <Text style={{ fontFamily: 'Helvetica', fontSize: 6.8, color: '#A8A29E' }}>
                      Edisi Koleksi Cetak B5 (176mm x 250mm) • Bunda Journal Studio
                    </Text>
                  </View>
                </View>
                <View style={styles.footer}>
                  <Text style={styles.footerPageNum}>1</Text>
                  <Text style={styles.footerBookTitle}>bunda. — Jurnal Kehamilan</Text>
                  <Text style={styles.footerChapter}>Cover Judul</Text>
                </View>
              </Page>

              {/* HALAMAN 2: PRAKATA & PANDUAN */}
              <Page size="B5" style={styles.page}>
                <View style={styles.pageBorderFrame} />
                <View style={styles.innerPageContainer}>
                  <View>
                    {/* Header Bar */}
                    <View style={styles.topHeaderBar}>
                      <View>
                        <Text style={styles.topHeaderCategory}>PRAKATA</Text>
                        <Text style={styles.topHeaderTitle}>Surat Pembuka untuk Malaikat Kecilku</Text>
                      </View>
                      <View style={styles.topHeaderBadge}>
                        <Text style={styles.topHeaderBadgeText}>PENGANTAR</Text>
                      </View>
                    </View>

                    {/* Editorial Opening Card */}
                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Untaian Doa Penantian</Text>
                        <Text style={styles.cardHeaderSubtext}>Dari Lubuk Hati Bunda</Text>
                      </View>
                      <View style={styles.cardBody}>
                        <Text style={{ fontFamily: 'Times-Roman', fontSize: 8.5, color: '#292524', lineHeight: 1.5, marginBottom: 6 }}>
                          Untuk buah hatiku tercinta,{'\n'}
                          Buku ini dirangkai lembar demi lembar bukan sekadar sebagai catatan medis atau album foto, melainkan sebagai saksi bisu betapa hadirmu dinanti dengan segenap jiwa dan doa tak berujung.
                        </Text>
                        <Text style={{ fontFamily: 'Times-Roman', fontSize: 8.5, color: '#292524', lineHeight: 1.5 }}>
                          Setiap detak jantungmu yang terdengar di layar USG, setiap tendangan lembut yang menggelitik di malam hari, hingga doa-doa yang kami panjatkan dalam diam — semuanya tersimpan abadi di dalam 100 halaman ini.
                        </Text>
                      </View>
                    </View>

                    {/* Chapter Structure Roadmap Card */}
                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Struktur 5 Bab Buku Kenangan</Text>
                        <Text style={styles.cardHeaderSubtext}>100 Halaman Presisi B5</Text>
                      </View>
                      <View style={[styles.cardBody, { paddingVertical: 4 }]}>
                        <View style={styles.tableRow}>
                          <Text style={styles.tableRowLabel}>• Bab 1: Awal Mula Kisah</Text>
                          <Text style={styles.tableRowValue}>Hal 3–6 (Test Pack, Reaksi, USG, Ngidam)</Text>
                        </View>
                        <View style={styles.tableRow}>
                          <Text style={styles.tableRowLabel}>• Bab 2: Jurnal Kehamilan Mingguan</Text>
                          <Text style={styles.tableRowValue}>Hal 7–84 (Trimester 1, 2, 3 & Week 5–40)</Text>
                        </View>
                        <View style={styles.tableRow}>
                          <Text style={styles.tableRowLabel}>• Bab 3: Persiapan Menyambut Si Kecil</Text>
                          <Text style={styles.tableRowValue}>Hal 85–90 (Nama, Kamar, Belanja, Tas RS)</Text>
                        </View>
                        <View style={styles.tableRow}>
                          <Text style={styles.tableRowLabel}>• Bab 4: Hari Kelahiran</Text>
                          <Text style={styles.tableRowValue}>Hal 91–96 (Persalinan, Biodata, Cap Kaki)</Text>
                        </View>
                        <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                          <Text style={styles.tableRowLabel}>• Bab 5: Kapsul Waktu</Text>
                          <Text style={styles.tableRowValue}>Hal 97–100 (Surat Wasiat Bunda & Ayah)</Text>
                        </View>
                      </View>
                    </View>

                    {/* Quote Banner */}
                    <View style={styles.milestoneCard}>
                      <Text style={styles.milestoneTitle}>PESAN CINTA ABADI</Text>
                      <Text style={styles.milestoneQuote}>
                        "Kau adalah doa yang mewujud nyata, keajaiban kecil yang menyempurnakan rumah cinta kita."
                      </Text>
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.footerPageNum}>2</Text>
                    <Text style={styles.footerBookTitle}>bunda. — Jurnal Kehamilan</Text>
                    <Text style={styles.footerChapter}>Prakata</Text>
                  </View>
                </View>
              </Page>
            </React.Fragment>
          );
        }

        // --------------------------------------------------------------------
        // SPREAD 1: HALAMAN 3 & 4 (Bab 1: Test Pack & Reaksi Ayah)
        // --------------------------------------------------------------------
        if (sIdx === 1) {
          const testPackDate = bab1Data?.testPackDate || 'Sabtu, 14 September 2024';
          const testPackPlace = bab1Data?.testPackTimePlace || '06:15 Pagi • Kamar Mandi Rumah';
          const motherFeelings = bab1Data?.motherFeelings || bab1Data?.motherFirstThought || 'Tangan bunda gemetar saat melihat dua garis merah itu tampak begitu jelas di pagi hari yang tenang. Rasa haru dan syukur tak terkira memenuhi rongga dada.';
          const fatherReaction = bab1Data?.fatherReaction || 'Bunda meletakkan kotak kado kecil berisi test pack di samping cangkir kopi ayah. Saat membukanya, ayah terdiam haru lalu memeluk bunda erat sekali.';
          const familyReaction = bab1Data?.familyReaction || 'Kakek dan nenek langsung sujud syukur dan menelepon semua keluarga. Doa-doa terbaik mengalir tiada henti menyambut hadirnya calon cucu tersayang.';

          return (
            <React.Fragment key={`spread-${sIdx}`}>
              {/* HALAMAN 3: TEST PACK */}
              <Page size="B5" style={styles.page}>
                <View style={styles.pageBorderFrame} />
                <View style={styles.innerPageContainer}>
                  <View>
                    <View style={styles.topHeaderBar}>
                      <View>
                        <Text style={styles.topHeaderCategory}>BAB 1: AWAL MULA KISAH</Text>
                        <Text style={styles.topHeaderTitle}>Saat Garis Dua Mengubah Segalanya</Text>
                      </View>
                      <View style={styles.topHeaderBadge}>
                        <Text style={styles.topHeaderBadgeText}>KABAR GEMBIRA</Text>
                      </View>
                    </View>

                    {/* Metadata Card */}
                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Momen Pertama Garis Dua</Text>
                        <Text style={styles.cardHeaderSubtext}>Bukti Awal Kehidupan</Text>
                      </View>
                      <View style={[styles.cardBody, { paddingVertical: 4 }]}>
                        <View style={styles.tableRow}>
                          <Text style={styles.tableRowLabel}>Hari & Tanggal:</Text>
                          <Text style={styles.tableRowValue}>{testPackDate}</Text>
                        </View>
                        <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                          <Text style={styles.tableRowLabel}>Waktu & Lokasi:</Text>
                          <Text style={styles.tableRowValue}>{testPackPlace}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Polaroid Photo Box */}
                    <View style={styles.polaroidContainer}>
                      <View style={styles.washiTape} />
                      <View style={styles.polaroidImageHolder}>
                        {bab1Data?.testPackPhoto ? (
                          <Image src={bab1Data.testPackPhoto} style={styles.polaroidImage} />
                        ) : (
                          <Text style={{ fontFamily: 'Helvetica', fontSize: 7.5, color: '#78716C' }}>
                            [ Foto Test Pack Dua Garis ]
                          </Text>
                        )}
                      </View>
                      <Text style={styles.polaroidCaption}>Kenangan sakral garis dua pertama yang mengubah takdir kita</Text>
                    </View>

                    {/* Curahan Hati Card */}
                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Curahan Hati Bunda</Text>
                        <Text style={styles.cardHeaderSubtext}>Detik-detik Mengetahuinya</Text>
                      </View>
                      <View style={styles.cardBody}>
                        <Text style={{ fontFamily: 'Times-Roman', fontSize: 8.5, color: '#292524', lineHeight: 1.45 }}>
                          {motherFeelings}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.footerPageNum}>3</Text>
                    <Text style={styles.footerBookTitle}>bunda. — Jurnal Kehamilan</Text>
                    <Text style={styles.footerChapter}>Bab 1 • Garis Dua</Text>
                  </View>
                </View>
              </Page>

              {/* HALAMAN 4: REAKSI AYAH & KELUARGA */}
              <Page size="B5" style={styles.page}>
                <View style={styles.pageBorderFrame} />
                <View style={styles.innerPageContainer}>
                  <View>
                    <View style={styles.topHeaderBar}>
                      <View>
                        <Text style={styles.topHeaderCategory}>BAB 1: AWAL MULA KISAH</Text>
                        <Text style={styles.topHeaderTitle}>Air Mata Bahagia & Pelukan Pertama</Text>
                      </View>
                      <View style={styles.topHeaderBadge}>
                        <Text style={styles.topHeaderBadgeText}>REAKSI KELUARGA</Text>
                      </View>
                    </View>

                    {/* Ayah Reaction Card */}
                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Reaksi Pertama Ayah</Text>
                        <Text style={styles.cardHeaderSubtext}>Momen Haru & Pelukan Erat</Text>
                      </View>
                      <View style={styles.cardBody}>
                        <Text style={{ fontFamily: 'Times-Roman', fontSize: 8.5, color: '#292524', lineHeight: 1.45 }}>
                          {fatherReaction}
                        </Text>
                      </View>
                    </View>

                    {/* Family Reaction Card */}
                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Reaksi Kakek, Nenek & Keluarga Besar</Text>
                        <Text style={styles.cardHeaderSubtext}>Doa yang Mengalir</Text>
                      </View>
                      <View style={styles.cardBody}>
                        <Text style={{ fontFamily: 'Times-Roman', fontSize: 8.5, color: '#292524', lineHeight: 1.45 }}>
                          {familyReaction}
                        </Text>
                      </View>
                    </View>

                    {/* Quote Banner */}
                    <View style={styles.milestoneCard}>
                      <Text style={styles.milestoneTitle}>IKATAN TIGA HATI</Text>
                      <Text style={styles.milestoneQuote}>
                        "Dua hati yang bersatu kini bersiap menyambut detak jantung ketiga yang membawa sejuta berkah dan kebahagiaan abadi."
                      </Text>
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.footerPageNum}>4</Text>
                    <Text style={styles.footerBookTitle}>bunda. — Jurnal Kehamilan</Text>
                    <Text style={styles.footerChapter}>Bab 1 • Reaksi Ayah</Text>
                  </View>
                </View>
              </Page>
            </React.Fragment>
          );
        }

        // --------------------------------------------------------------------
        // SPREAD 2: HALAMAN 5 & 6 (Bab 1: USG Pertama & Ngidam)
        // --------------------------------------------------------------------
        if (sIdx === 2) {
          const doctorName = bab1Data?.doctor || userProfile?.doctorName || 'dr. Sarah Sp.OG';
          const hospitalName = bab1Data?.hospital || userProfile?.hospitalName || 'RSIA Bunda Menteng';
          const heartRate = bab1Data?.heartRate || '142 bpm (Normal & Kuat)';
          const heartbeatImpression = bab1Data?.heartbeatImpression || 'Bunyinya cepat dan teratur seperti derap langkah kepakan sayap burung kecil. Air mata bunda menetes haru di ranjang periksa dokter.';
          const cravings = bab1Data?.cravings || '1. Buah mangga muda asam manis potong dingin\n2. Sup kaldu ayam jahe hangat buatan nenek\n3. Es air kelapa muda murni di siang hari';
          const avoidedFoods = bab1Data?.avoidedFoods || '• Bau tumisan bawang putih dan minyak panas\n• Kopi hitam pekat\n• Parfum beraroma manis menyengat';
          const partnerSupport = bab1Data?.partnerSupport || 'Ayah yang rela membelikan biskuit jahe jam 11 malam dan memijat punggung bunda setiap subuh saat mual datang melanda.';

          return (
            <React.Fragment key={`spread-${sIdx}`}>
              {/* HALAMAN 5: USG PERTAMA */}
              <Page size="B5" style={styles.page}>
                <View style={styles.pageBorderFrame} />
                <View style={styles.innerPageContainer}>
                  <View>
                    <View style={styles.topHeaderBar}>
                      <View>
                        <Text style={styles.topHeaderCategory}>BAB 1: AWAL MULA KISAH</Text>
                        <Text style={styles.topHeaderTitle}>Detak Jantung Pertama di Layar USG</Text>
                      </View>
                      <View style={styles.topHeaderBadge}>
                        <Text style={styles.topHeaderBadgeText}>USG PERDANA</Text>
                      </View>
                    </View>

                    {/* Medical Check Card */}
                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Data Pemeriksaan Medis</Text>
                        <Text style={styles.cardHeaderSubtext}>Klinik / RS Bersalin</Text>
                      </View>
                      <View style={[styles.cardBody, { paddingVertical: 4 }]}>
                        <View style={styles.tableRow}>
                          <Text style={styles.tableRowLabel}>Dokter Spesialis:</Text>
                          <Text style={styles.tableRowValue}>{doctorName}</Text>
                        </View>
                        <View style={styles.tableRow}>
                          <Text style={styles.tableRowLabel}>Rumah Sakit:</Text>
                          <Text style={styles.tableRowValue}>{hospitalName}</Text>
                        </View>
                        <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                          <Text style={styles.tableRowLabel}>Detak Jantung Janin:</Text>
                          <Text style={[styles.tableRowValue, { color: '#556B2F' }]}>{heartRate}</Text>
                        </View>
                      </View>
                    </View>

                    {/* Polaroid Photo Box */}
                    <View style={styles.polaroidContainer}>
                      <View style={styles.washiTape} />
                      <View style={styles.polaroidImageHolder}>
                        {bab1Data?.usgKantungPhoto ? (
                          <Image src={bab1Data.usgKantungPhoto} style={styles.polaroidImage} />
                        ) : (
                          <Text style={{ fontFamily: 'Helvetica', fontSize: 7.5, color: '#78716C' }}>
                            [ Foto Cetak USG Kantung Janin ]
                          </Text>
                        )}
                      </View>
                      <Text style={styles.polaroidCaption}>Titik kecil penuh keajaiban yang kini berdetak nyata di rahim bunda</Text>
                    </View>

                    {/* Heartbeat Impression Card */}
                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Kesan Suara Detak Jantung</Text>
                        <Text style={styles.cardHeaderSubtext}>Nada Terindah di Dunia</Text>
                      </View>
                      <View style={styles.cardBody}>
                        <Text style={{ fontFamily: 'Times-Roman', fontSize: 8.5, color: '#292524', lineHeight: 1.45 }}>
                          {heartbeatImpression}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.footerPageNum}>5</Text>
                    <Text style={styles.footerBookTitle}>bunda. — Jurnal Kehamilan</Text>
                    <Text style={styles.footerChapter}>Bab 1 • USG Pertama</Text>
                  </View>
                </View>
              </Page>

              {/* HALAMAN 6: CERITA NGIDAM */}
              <Page size="B5" style={styles.page}>
                <View style={styles.pageBorderFrame} />
                <View style={styles.innerPageContainer}>
                  <View>
                    <View style={styles.topHeaderBar}>
                      <View>
                        <Text style={styles.topHeaderCategory}>BAB 1: AWAL MULA KISAH</Text>
                        <Text style={styles.topHeaderTitle}>Cerita Ngidam & Kasih Sayang Ayah</Text>
                      </View>
                      <View style={styles.topHeaderBadge}>
                        <Text style={styles.topHeaderBadgeText}>TRIMESTER AWAL</Text>
                      </View>
                    </View>

                    {/* Cravings Card */}
                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Makanan & Keinginan Unik Bunda</Text>
                        <Text style={styles.cardHeaderSubtext}>Selera Buah Hati</Text>
                      </View>
                      <View style={styles.cardBody}>
                        <Text style={{ fontFamily: 'Times-Roman', fontSize: 8.5, color: '#292524', lineHeight: 1.45 }}>
                          {cravings}
                        </Text>
                      </View>
                    </View>

                    {/* Avoided Foods Card */}
                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Aroma & Makanan yang Dihindari</Text>
                        <Text style={styles.cardHeaderSubtext}>Pemicu Mual & Sensitivitas</Text>
                      </View>
                      <View style={styles.cardBody}>
                        <Text style={{ fontFamily: 'Times-Roman', fontSize: 8.5, color: '#292524', lineHeight: 1.45 }}>
                          {avoidedFoods}
                        </Text>
                      </View>
                    </View>

                    {/* Partner Support Card */}
                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Dukungan Termanis dari Ayah</Text>
                        <Text style={styles.cardHeaderSubtext}>Siaga Penuh Kasih</Text>
                      </View>
                      <View style={styles.cardBody}>
                        <Text style={{ fontFamily: 'Times-Roman', fontSize: 8.5, color: '#292524', lineHeight: 1.45 }}>
                          {partnerSupport}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.footerPageNum}>6</Text>
                    <Text style={styles.footerBookTitle}>bunda. — Jurnal Kehamilan</Text>
                    <Text style={styles.footerChapter}>Bab 1 • Cerita Ngidam</Text>
                  </View>
                </View>
              </Page>
            </React.Fragment>
          );
        }

        // --------------------------------------------------------------------
        // SPREAD 3: HALAMAN 7 & 8 (Pembatas Trimester 1)
        // --------------------------------------------------------------------
        if (sIdx === 3) {
          return (
            <React.Fragment key={`spread-${sIdx}`}>
              <Page size="B5" style={styles.page}>
                <View style={styles.pageBorderFrame} />
                <View style={styles.innerPageContainer}>
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
                    <Text style={[styles.topHeaderCategory, { fontSize: 8, letterSpacing: 2 }]}>
                      TRIMESTER PERTAMA
                    </Text>
                    <Text style={[styles.topHeaderTitle, { fontSize: 24, textAlign: 'center', marginVertical: 4 }]}>
                      Minggu ke-1 hingga Minggu ke-13
                    </Text>
                    <View style={{ width: 42, height: 1.5, backgroundColor: '#556B2F', marginVertical: 8 }} />
                    <View style={[styles.cardContainer, { width: '92%', padding: 12, backgroundColor: '#FFFFFF' }]}>
                      <Text style={[styles.milestoneQuote, { fontSize: 10.5, lineHeight: 1.55 }]}>
                        "Dari sebutir sel yang tak kasat mata, kini kau bertumbuh menjadi manusia kecil dengan detak jantung penuh cinta."
                      </Text>
                    </View>
                  </View>
                  <View style={styles.footer}>
                    <Text style={styles.footerPageNum}>7</Text>
                    <Text style={styles.footerBookTitle}>bunda. — Jurnal Kehamilan</Text>
                    <Text style={styles.footerChapter}>Pembatas Trimester 1</Text>
                  </View>
                </View>
              </Page>

              <Page size="B5" style={styles.page}>
                <View style={styles.pageBorderFrame} />
                <View style={styles.innerPageContainer}>
                  <View>
                    <View style={styles.topHeaderBar}>
                      <View>
                        <Text style={styles.topHeaderCategory}>PANDUAN TRIMESTER 1</Text>
                        <Text style={styles.topHeaderTitle}>Fokus Kesehatan & Doa Ibu</Text>
                      </View>
                      <View style={styles.topHeaderBadge}>
                        <Text style={styles.topHeaderBadgeAccent}>T1</Text>
                      </View>
                    </View>

                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Fokus Utama Trimester 1</Text>
                        <Text style={styles.cardHeaderSubtext}>Pembentukan Organ Penting</Text>
                      </View>
                      <View style={styles.cardBody}>
                        <Text style={styles.tableRowLabel}>• Konsumsi Asam Folat 400mcg & Zat Besi secara teratur</Text>
                        <Text style={styles.tableRowLabel}>• Mengatasi Morning Sickness dengan porsi makan kecil tapi sering</Text>
                        <Text style={styles.tableRowLabel}>• Hindari makanan mentah, kafein berlebih, dan zat kimia berbahaya</Text>
                        <Text style={styles.tableRowLabel}>• Tidur cukup 8-9 jam per hari dan kurangi beban stres</Text>
                      </View>
                    </View>

                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Untaian Doa untuk Buah Hati</Text>
                        <Text style={styles.cardHeaderSubtext}>Perlindungan dari Sang Pencipta</Text>
                      </View>
                      <View style={styles.cardBody}>
                        <Text style={{ fontFamily: 'Times-Roman', fontSize: 8.5, color: '#292524', lineHeight: 1.45 }}>
                          "Ya Tuhan, lindungilah calon buah hati kami di dalam rahim ini. Sempurnakanlah pembentukan organ-organnya, kuatkanlah detak jantungnya, dan anugerahilah bunda kesehatan serta ketenangan jiwa dalam menjaganya."
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.footerPageNum}>8</Text>
                    <Text style={styles.footerBookTitle}>bunda. — Jurnal Kehamilan</Text>
                    <Text style={styles.footerChapter}>Pembatas Trimester 1</Text>
                  </View>
                </View>
              </Page>
            </React.Fragment>
          );
        }

        // --------------------------------------------------------------------
        // SPREAD 13: HALAMAN 27 & 28 (Pembatas Trimester 2)
        // --------------------------------------------------------------------
        if (sIdx === 13) {
          return (
            <React.Fragment key={`spread-${sIdx}`}>
              <Page size="B5" style={styles.page}>
                <View style={styles.pageBorderFrame} />
                <View style={styles.innerPageContainer}>
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
                    <Text style={[styles.topHeaderCategory, { fontSize: 8, letterSpacing: 2 }]}>
                      TRIMESTER KEDUA
                    </Text>
                    <Text style={[styles.topHeaderTitle, { fontSize: 24, textAlign: 'center', marginVertical: 4 }]}>
                      Minggu ke-14 hingga Minggu ke-27
                    </Text>
                    <View style={{ width: 42, height: 1.5, backgroundColor: '#556B2F', marginVertical: 8 }} />
                    <View style={[styles.cardContainer, { width: '92%', padding: 12, backgroundColor: '#FFFFFF' }]}>
                      <Text style={[styles.milestoneQuote, { fontSize: 10.5, lineHeight: 1.55 }]}>
                        "Saat kepakan lembut di dalam perut bunda itu nyata... itu adalah salam cinta pertamamu dari dalam rahim."
                      </Text>
                    </View>
                  </View>
                  <View style={styles.footer}>
                    <Text style={styles.footerPageNum}>27</Text>
                    <Text style={styles.footerBookTitle}>bunda. — Jurnal Kehamilan</Text>
                    <Text style={styles.footerChapter}>Pembatas Trimester 2</Text>
                  </View>
                </View>
              </Page>

              <Page size="B5" style={styles.page}>
                <View style={styles.pageBorderFrame} />
                <View style={styles.innerPageContainer}>
                  <View>
                    <View style={styles.topHeaderBar}>
                      <View>
                        <Text style={styles.topHeaderCategory}>PANDUAN TRIMESTER 2</Text>
                        <Text style={styles.topHeaderTitle}>Masa Emas & Sentuhan Kupu-Kupu</Text>
                      </View>
                      <View style={styles.topHeaderBadge}>
                        <Text style={styles.topHeaderBadgeAccent}>T2</Text>
                      </View>
                    </View>

                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Fokus Utama Trimester 2</Text>
                        <Text style={styles.cardHeaderSubtext}>Masa Paling Nyaman Kehamilan</Text>
                      </View>
                      <View style={styles.cardBody}>
                        <Text style={styles.tableRowLabel}>• Merasakan gerakan aktif (quickening) pertama si kecil</Text>
                        <Text style={styles.tableRowLabel}>• Pemeriksaan USG Morfologi / Detail Anatomi janin (W20-22)</Text>
                        <Text style={styles.tableRowLabel}>• Mulai mengajak janin berbicara dan mendengarkan alunan musik</Text>
                        <Text style={styles.tableRowLabel}>• Senam hamil ringan dan menjaga postur punggung</Text>
                      </View>
                    </View>

                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Doa Penguat Jiwa</Text>
                        <Text style={styles.cardHeaderSubtext}>Kecerdasan & Kesehatan</Text>
                      </View>
                      <View style={styles.cardBody}>
                        <Text style={{ fontFamily: 'Times-Roman', fontSize: 8.5, color: '#292524', lineHeight: 1.45 }}>
                          "Semoga otak, tulang, dan seluruh indra buah hati kami bertumbuh sehat sempurna, menjadi anak yang cerdas budi dan penyejuk hati bagi kedua orang tuanya."
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.footerPageNum}>28</Text>
                    <Text style={styles.footerBookTitle}>bunda. — Jurnal Kehamilan</Text>
                    <Text style={styles.footerChapter}>Pembatas Trimester 2</Text>
                  </View>
                </View>
              </Page>
            </React.Fragment>
          );
        }

        // --------------------------------------------------------------------
        // SPREAD 28: HALAMAN 57 & 58 (Pembatas Trimester 3)
        // --------------------------------------------------------------------
        if (sIdx === 28) {
          return (
            <React.Fragment key={`spread-${sIdx}`}>
              <Page size="B5" style={styles.page}>
                <View style={styles.pageBorderFrame} />
                <View style={styles.innerPageContainer}>
                  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16 }}>
                    <Text style={[styles.topHeaderCategory, { fontSize: 8, letterSpacing: 2 }]}>
                      TRIMESTER KETIGA
                    </Text>
                    <Text style={[styles.topHeaderTitle, { fontSize: 24, textAlign: 'center', marginVertical: 4 }]}>
                      Minggu ke-28 hingga Minggu ke-40
                    </Text>
                    <View style={{ width: 42, height: 1.5, backgroundColor: '#556B2F', marginVertical: 8 }} />
                    <View style={[styles.cardContainer, { width: '92%', padding: 12, backgroundColor: '#FFFFFF' }]}>
                      <Text style={[styles.milestoneQuote, { fontSize: 10.5, lineHeight: 1.55 }]}>
                        "Setiap tarikan napas kini adalah doa, setiap tendangan kuatmu adalah kabar bahwa rumah cinta kita segera lengkap."
                      </Text>
                    </View>
                  </View>
                  <View style={styles.footer}>
                    <Text style={styles.footerPageNum}>57</Text>
                    <Text style={styles.footerBookTitle}>bunda. — Jurnal Kehamilan</Text>
                    <Text style={styles.footerChapter}>Pembatas Trimester 3</Text>
                  </View>
                </View>
              </Page>

              <Page size="B5" style={styles.page}>
                <View style={styles.pageBorderFrame} />
                <View style={styles.innerPageContainer}>
                  <View>
                    <View style={styles.topHeaderBar}>
                      <View>
                        <Text style={styles.topHeaderCategory}>PANDUAN TRIMESTER 3</Text>
                        <Text style={styles.topHeaderTitle}>Menghitung Hari Menuju Dekapan</Text>
                      </View>
                      <View style={styles.topHeaderBadge}>
                        <Text style={styles.topHeaderBadgeAccent}>T3</Text>
                      </View>
                    </View>

                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Fokus Utama Trimester 3</Text>
                        <Text style={styles.cardHeaderSubtext}>Persiapan Persalinan Nyaman</Text>
                      </View>
                      <View style={styles.cardBody}>
                        <Text style={styles.tableRowLabel}>• Latihan pernapasan relaksasi dan teknik mengejan</Text>
                        <Text style={styles.tableRowLabel}>• Menyiapkan tas bersalin ke rumah sakit (hospital bag)</Text>
                        <Text style={styles.tableRowLabel}>• Memantau hitungan tendangan harian janin (kick count 10 gerakan)</Text>
                        <Text style={styles.tableRowLabel}>• Mengenali tanda-tanda awal persalinan dan kontraksi asli</Text>
                      </View>
                    </View>

                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Doa Keselamatan Persalinan</Text>
                        <Text style={styles.cardHeaderSubtext}>Kekuatan Lahir & Batin</Text>
                      </View>
                      <View style={styles.cardBody}>
                        <Text style={{ fontFamily: 'Times-Roman', fontSize: 8.5, color: '#292524', lineHeight: 1.45 }}>
                          "Ya Tuhan kami, mudahkanlah dan lancarkanlah persalinan nanti. Berikanlah bunda kekuatan fisik dan batin, selamatkanlah ibu dan buah hati dalam pelukan yang hangat."
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.footerPageNum}>58</Text>
                    <Text style={styles.footerBookTitle}>bunda. — Jurnal Kehamilan</Text>
                    <Text style={styles.footerChapter}>Pembatas Trimester 3</Text>
                  </View>
                </View>
              </Page>
            </React.Fragment>
          );
        }

        // --------------------------------------------------------------------
        // WEEKLY JOURNAL SPREADS: WEEKS 5 to 40
        // (Spreads 4-12, 14-27, 29-41)
        // --------------------------------------------------------------------
        if (
          (sIdx >= 4 && sIdx <= 12) ||
          (sIdx >= 14 && sIdx <= 27) ||
          (sIdx >= 29 && sIdx <= 41)
        ) {
          let weekNum = 5;
          if (sIdx >= 4 && sIdx <= 12) weekNum = 5 + (sIdx - 4);
          else if (sIdx >= 14 && sIdx <= 27) weekNum = 14 + (sIdx - 14);
          else if (sIdx >= 29 && sIdx <= 41) weekNum = 28 + (sIdx - 29);

          const weekData = getWeekData(weekNum);
          const matchedEntry = pastEntries.find((e) => e.week === weekNum);
          const matchedPhoto = customPhotos[weekNum] || photos.find((p) => p.week === weekNum);

          const savedDaily = getSavedStorage(`bunda_daily_w${weekNum}`);
          const savedMomStats = getSavedStorage(`bunda_momstats_w${weekNum}`);

          const weightVal = savedMomStats?.weight || (50 + weekNum * 0.35).toFixed(1);
          const waistVal = savedMomStats?.waist || (75 + weekNum * 0.6).toFixed(0);
          const bpVal = savedMomStats?.bloodPressure || '118/76';
          const doctorNotes = savedMomStats?.doctorNote || `• Janin bertumbuh sehat, panjang ~${weekData.lengthCm}, berat ~${weekData.weightGrams}.\n• Detak jantung terpantau baik ${weekData.heartbeatBpm}.\n• Teruskan vitamin dan minum air 2 liter/hari.`;

          const daysLabel = [
            { key: 'Sen', label: 'Sen' },
            { key: 'Sel', label: 'Sel' },
            { key: 'Rab', label: 'Rab' },
            { key: 'Kam', label: 'Kam' },
            { key: 'Jum', label: 'Jum' },
            { key: 'Sab', label: 'Sab' },
            { key: 'Min', label: 'Min', isSunday: true },
          ];

          return (
            <React.Fragment key={`spread-${sIdx}`}>
              {/* ========================================================== */}
              {/* HALAMAN KIRI: TRACKER & JURNAL HARIAN BUNDA                */}
              {/* ========================================================== */}
              <Page size="B5" style={styles.page}>
                <View style={styles.pageBorderFrame} />
                <View style={styles.innerPageContainer}>
                  <View>
                    {/* Top Header Bar */}
                    <View style={styles.topHeaderBar}>
                      <View>
                        <Text style={styles.topHeaderCategory}>Bab 2: Jurnal Kehamilan</Text>
                        <Text style={styles.topHeaderTitle}>Week {weekNum}</Text>
                      </View>
                      <View style={styles.topHeaderBadge}>
                        <Text style={styles.topHeaderBadgeText}>
                          Tanggal: {matchedEntry?.date || `${weekNum * 7} Hari Perjalanan`}
                        </Text>
                        <Text style={styles.topHeaderBadgeAccent}>• T{weekData.trimester}</Text>
                      </View>
                    </View>

                    {/* Card: Catatan Harian Bunda (Senin - Minggu) */}
                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Catatan Harian Bunda</Text>
                        <Text style={styles.cardHeaderSubtext}>Refleksi 7 Hari</Text>
                      </View>
                      <View style={styles.dailyRowsContainer}>
                        {daysLabel.map((dayObj, idx) => {
                          const note = savedDaily?.[dayObj.key] || (idx === 0 && matchedEntry?.text ? matchedEntry.text.slice(0, 75) : `Catatan dan rasa syukur hari ${dayObj.label}...`);
                          return (
                            <View key={idx} style={[styles.dailyRow, idx === 6 && { borderBottomWidth: 0 }]}>
                              <View style={styles.dayBadge}>
                                <Text style={[styles.dayBadgeText, dayObj.isSunday && styles.dayBadgeTextSunday]}>
                                  {dayObj.label}
                                </Text>
                              </View>
                              <Text style={styles.dailyText}>{note}</Text>
                            </View>
                          );
                        })}
                      </View>
                    </View>

                    {/* Card: Ceklis Kebiasaan & Hidrasi Sehat */}
                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Ceklis Suplemen & Hidrasi</Text>
                        <Text style={styles.cardHeaderSubtext}>Target Harian</Text>
                      </View>
                      <View style={[styles.cardBody, { paddingVertical: 4 }]}>
                        <View style={styles.tableRow}>
                          <Text style={styles.tableRowLabel}>Vitamin Asam Folat & Zat Besi</Text>
                          <View style={styles.checkPillActive}>
                            <Text style={styles.checkPillText}>[v] 7 Hari Tercapai</Text>
                          </View>
                        </View>
                        <View style={styles.tableRow}>
                          <Text style={styles.tableRowLabel}>Target Hidrasi Air 2–2.5 Liter</Text>
                          <View style={styles.checkPillActive}>
                            <Text style={styles.checkPillText}>[v] Tercukupi Baik</Text>
                          </View>
                        </View>
                        <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                          <Text style={styles.tableRowLabel}>Jalan Santai / Gerak Ringan 15 Menit</Text>
                          <View style={styles.checkPillActive}>
                            <Text style={styles.checkPillText}>[v] Rutin Aktif</Text>
                          </View>
                        </View>
                      </View>
                    </View>

                    {/* Card: Ringkasan Tidur & Suasana Hati */}
                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Pola Istirahat & Suasana Hati</Text>
                        <Text style={styles.cardHeaderSubtext}>Kebugaran Tubuh</Text>
                      </View>
                      <View style={[styles.cardBody, { paddingVertical: 4 }]}>
                        <View style={styles.tableRow}>
                          <Text style={styles.tableRowLabel}>Rata-rata Jam Tidur:</Text>
                          <Text style={styles.tableRowValue}>7.5 – 8.5 Jam / malam (Berkualitas)</Text>
                        </View>
                        <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                          <Text style={styles.tableRowLabel}>Dominasi Mood:</Text>
                          <Text style={[styles.tableRowValue, { color: '#556B2F' }]}>Bahagia, Rileks & Penuh Syukur</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.footerPageNum}>{leftNum}</Text>
                    <Text style={styles.footerBookTitle}>bunda. — Week {weekNum}</Text>
                    <Text style={styles.footerChapter}>Jurnal Bunda</Text>
                  </View>
                </View>
              </Page>

              {/* ========================================================== */}
              {/* HALAMAN KANAN: GALERI USG, STATS & CATATAN DOKTER          */}
              {/* ========================================================== */}
              <Page size="B5" style={styles.page}>
                <View style={styles.pageBorderFrame} />
                <View style={styles.innerPageContainer}>
                  <View>
                    {/* Milestone Card */}
                    <View style={styles.milestoneCard}>
                      <Text style={styles.milestoneTitle}>
                        Milestone Minggu ke-{weekNum} • Sebesar {weekData.fruit}
                      </Text>
                      <Text style={styles.milestoneQuote}>
                        "{weekData.quote}"
                      </Text>
                    </View>

                    {/* Polaroid Photo Frame */}
                    <View style={styles.polaroidContainer}>
                      <View style={styles.washiTape} />
                      <View style={styles.polaroidImageHolder}>
                        {matchedPhoto?.src ? (
                          <Image src={matchedPhoto.src} style={styles.polaroidImage} />
                        ) : matchedPhoto?.url ? (
                          <Image src={matchedPhoto.url} style={styles.polaroidImage} />
                        ) : (
                          <Text style={{ fontFamily: 'Helvetica', fontSize: 7.5, color: '#78716C' }}>
                            [ Foto USG / Baby Bump W{weekNum} ]
                          </Text>
                        )}
                      </View>
                      <Text style={styles.polaroidCaption}>
                        {matchedPhoto?.caption || `Momen Minggu ke-${weekNum} • ${weekData.title}`}
                      </Text>
                    </View>

                    {/* 3-Column Metrics (Mirrors Studio Widget) */}
                    <View style={styles.metricsGrid3}>
                      <View style={styles.metricCard}>
                        <View style={styles.metricHeader}>
                          <Text style={styles.metricHeaderText}>BERAT BUNDA</Text>
                        </View>
                        <View style={styles.metricBody}>
                          <Text style={styles.metricValue}>{weightVal} <Text style={{ fontSize: 7.5, color: '#78716C' }}>kg</Text></Text>
                        </View>
                      </View>

                      <View style={styles.metricCard}>
                        <View style={styles.metricHeader}>
                          <Text style={styles.metricHeaderText}>LINGKAR PERUT</Text>
                        </View>
                        <View style={styles.metricBody}>
                          <Text style={styles.metricValue}>{waistVal} <Text style={{ fontSize: 7.5, color: '#78716C' }}>cm</Text></Text>
                        </View>
                      </View>

                      <View style={styles.metricCard}>
                        <View style={styles.metricHeader}>
                          <Text style={styles.metricHeaderText}>TEKANAN DARAH</Text>
                        </View>
                        <View style={styles.metricBody}>
                          <Text style={styles.metricValue}>{bpVal} <Text style={{ fontSize: 6.8, color: '#78716C' }}>mmHg</Text></Text>
                        </View>
                      </View>
                    </View>

                    {/* Medical / Doctor Examination Card */}
                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Catatan Dokter & Pemeriksaan</Text>
                        <Text style={styles.cardHeaderSubtext}>USG & Kesehatan</Text>
                      </View>
                      <View style={[styles.cardBody, { paddingVertical: 4 }]}>
                        <Text style={{ fontFamily: 'Times-Roman', fontSize: 8.2, color: '#292524', lineHeight: 1.4 }}>
                          {doctorNotes}
                        </Text>
                        <View style={{ marginTop: 4, paddingTop: 3, borderTopWidth: 0.5, borderTopColor: '#E7E5E4' }}>
                          <Text style={{ fontFamily: 'Helvetica', fontSize: 7.5, color: '#57534E' }}>
                            Perkembangan Janin: {weekData.babyDevelopment}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.footerPageNum}>{rightNum}</Text>
                    <Text style={styles.footerBookTitle}>bunda. — Week {weekNum}</Text>
                    <Text style={styles.footerChapter}>Klinis & Medis</Text>
                  </View>
                </View>
              </Page>
            </React.Fragment>
          );
        }

        // --------------------------------------------------------------------
        // SPREAD 42: HALAMAN 85 & 86 (Bab 3: Inspirasi Nama & Kamar Bayi)
        // --------------------------------------------------------------------
        if (sIdx === 42) {
          const chosenName = bab3Data?.chosenName || 'Kalandra Atharrazka';
          const chosenMeaning = bab3Data?.chosenMeaning || '"Penerang yang riang gembira dan senantiasa dilimpahi rezeki bersih."';

          return (
            <React.Fragment key={`spread-${sIdx}`}>
              <Page size="B5" style={styles.page}>
                <View style={styles.pageBorderFrame} />
                <View style={styles.innerPageContainer}>
                  <View>
                    <View style={styles.topHeaderBar}>
                      <View>
                        <Text style={styles.topHeaderCategory}>BAB 3: PERSIAPAN</Text>
                        <Text style={styles.topHeaderTitle}>Inspirasi Nama Indah Buah Hati</Text>
                      </View>
                      <View style={styles.topHeaderBadge}>
                        <Text style={styles.topHeaderBadgeText}>DOA TERBAIK</Text>
                      </View>
                    </View>

                    {/* Chosen Name Highlight Card */}
                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Nama Resmi Terpilih</Text>
                        <Text style={styles.cardHeaderSubtext}>Untaian Harapan Abadi</Text>
                      </View>
                      <View style={[styles.cardBody, { alignItems: 'center', paddingVertical: 8 }]}>
                        <Text style={{ fontFamily: 'Times-Bold', fontSize: 16, color: '#1C1917', marginBottom: 3 }}>
                          {chosenName}
                        </Text>
                        <Text style={{ fontFamily: 'Times-Italic', fontSize: 9, color: '#556B2F', textAlign: 'center', maxWidth: 220 }}>
                          {chosenMeaning}
                        </Text>
                      </View>
                    </View>

                    {/* Candidates Table Card */}
                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Daftar Kandidat Nama Pilihan</Text>
                        <Text style={styles.cardHeaderSubtext}>4 Pilihan Istimewa</Text>
                      </View>
                      <View style={[styles.cardBody, { paddingVertical: 4 }]}>
                        <View style={styles.tableRow}>
                          <Text style={styles.tableRowLabel}>1. Rayyan Al-Fatih</Text>
                          <Text style={styles.tableRowValue}>Pintu surga & penakluk berbudi luhur</Text>
                        </View>
                        <View style={styles.tableRow}>
                          <Text style={styles.tableRowLabel}>2. Kinanti Ayudia</Text>
                          <Text style={styles.tableRowValue}>Tembang harapan yang anggun & lembut</Text>
                        </View>
                        <View style={styles.tableRow}>
                          <Text style={styles.tableRowLabel}>3. Malik Ibrahim</Text>
                          <Text style={styles.tableRowValue}>Pemimpin bijaksana yang berjiwa teguh</Text>
                        </View>
                        <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                          <Text style={styles.tableRowLabel}>4. Nayla Salsabila</Text>
                          <Text style={styles.tableRowValue}>Anugerah kesuksesan mata air surga</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.footerPageNum}>85</Text>
                    <Text style={styles.footerBookTitle}>bunda. — Jurnal Kehamilan</Text>
                    <Text style={styles.footerChapter}>Bab 3 • Nama Bayi</Text>
                  </View>
                </View>
              </Page>

              <Page size="B5" style={styles.page}>
                <View style={styles.pageBorderFrame} />
                <View style={styles.innerPageContainer}>
                  <View>
                    <View style={styles.topHeaderBar}>
                      <View>
                        <Text style={styles.topHeaderCategory}>BAB 3: PERSIAPAN</Text>
                        <Text style={styles.topHeaderTitle}>Sudut Kamar & Ruang Tidur Bayi</Text>
                      </View>
                      <View style={styles.topHeaderBadge}>
                        <Text style={styles.topHeaderBadgeText}>RUANG BAYI</Text>
                      </View>
                    </View>

                    {/* Polaroid Photo Box */}
                    <View style={styles.polaroidContainer}>
                      <View style={styles.washiTape} />
                      <View style={[styles.polaroidImageHolder, { height: 110 }]}>
                        {bab3Data?.nurseryPhoto ? (
                          <Image src={bab3Data.nurseryPhoto} style={styles.polaroidImage} />
                        ) : (
                          <Text style={{ fontFamily: 'Helvetica', fontSize: 7.5, color: '#78716C' }}>
                            [ Foto Sudut Kamar Impian Bayi ]
                          </Text>
                        )}
                      </View>
                      <Text style={styles.polaroidCaption}>Sudut hangat tempat malaikat kecil kita beristirahat dan bermimpi</Text>
                    </View>

                    {/* Nursery Checklist Card */}
                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Checklist Perlengkapan Kamar</Text>
                        <Text style={styles.cardHeaderSubtext}>Kenyamanan & Keamanan</Text>
                      </View>
                      <View style={[styles.cardBody, { paddingVertical: 4 }]}>
                        <View style={styles.tableRow}>
                          <Text style={styles.tableRowLabel}>[v] Tempat Tidur Bayi (Crib) & Matras Lembut</Text>
                          <Text style={styles.tableRowValue}>Siap</Text>
                        </View>
                        <View style={styles.tableRow}>
                          <Text style={styles.tableRowLabel}>[v] Kelambu Halus Anti Nyamuk</Text>
                          <Text style={styles.tableRowValue}>Siap</Text>
                        </View>
                        <View style={styles.tableRow}>
                          <Text style={styles.tableRowLabel}>[v] Lampu Tidur Redup Hangat</Text>
                          <Text style={styles.tableRowValue}>Siap</Text>
                        </View>
                        <View style={styles.tableRow}>
                          <Text style={styles.tableRowLabel}>[v] Kursi Menyusui Nyaman Bunda</Text>
                          <Text style={styles.tableRowValue}>Siap</Text>
                        </View>
                        <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                          <Text style={styles.tableRowLabel}>[v] Termometer & Pengatur Suhu Ruangan</Text>
                          <Text style={styles.tableRowValue}>Siap</Text>
                        </View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.footerPageNum}>86</Text>
                    <Text style={styles.footerBookTitle}>bunda. — Jurnal Kehamilan</Text>
                    <Text style={styles.footerChapter}>Bab 3 • Kamar Bayi</Text>
                  </View>
                </View>
              </Page>
            </React.Fragment>
          );
        }

        // --------------------------------------------------------------------
        // SPREAD 43 & 44: HALAMAN 87-90 (Bab 3: Belanja & Tas RS)
        // --------------------------------------------------------------------
        if (sIdx === 43 || sIdx === 44) {
          const isSpread43 = sIdx === 43;
          return (
            <React.Fragment key={`spread-${sIdx}`}>
              <Page size="B5" style={styles.page}>
                <View style={styles.pageBorderFrame} />
                <View style={styles.innerPageContainer}>
                  <View>
                    <View style={styles.topHeaderBar}>
                      <View>
                        <Text style={styles.topHeaderCategory}>BAB 3: PERSIAPAN</Text>
                        <Text style={styles.topHeaderTitle}>
                          {isSpread43 ? 'Daftar Belanja Pakaian & Tidur Bayi' : 'Checklist Tas RS: Kebutuhan Bunda'}
                        </Text>
                      </View>
                      <View style={styles.topHeaderBadge}>
                        <Text style={styles.topHeaderBadgeText}>{isSpread43 ? 'PAKAIAN' : 'TAS RS'}</Text>
                      </View>
                    </View>

                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Daftar Kebutuhan Utama</Text>
                        <Text style={styles.cardHeaderSubtext}>Siap Pakai</Text>
                      </View>
                      <View style={[styles.cardBody, { paddingVertical: 4 }]}>
                        {isSpread43 ? (
                          <>
                            <View style={styles.tableRow}><Text style={styles.tableRowLabel}>• Baju kutung & pendek katun lembut</Text><Text style={styles.tableRowValue}>6 pcs</Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableRowLabel}>• Celana pop & celana panjang</Text><Text style={styles.tableRowValue}>6 pcs</Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableRowLabel}>• Bedong katun halus 100% breathable</Text><Text style={styles.tableRowValue}>6 pcs</Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableRowLabel}>• Sarung tangan & kaos kaki bayi</Text><Text style={styles.tableRowValue}>4 pasang</Text></View>
                            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}><Text style={styles.tableRowLabel}>• Popok kain newborn & popok sekali pakai</Text><Text style={styles.tableRowValue}>1 pack</Text></View>
                          </>
                        ) : (
                          <>
                            <View style={styles.tableRow}><Text style={styles.tableRowLabel}>• Dokumen: KTP, KK, Buku KIA/Pink, Asuransi</Text><Text style={styles.tableRowValue}>Lengkap</Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableRowLabel}>• 3 set baju bukaan depan untuk menyusui</Text><Text style={styles.tableRowValue}>Lengkap</Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableRowLabel}>• Pakaian dalam maternity & pembalut nifas</Text><Text style={styles.tableRowValue}>Lengkap</Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableRowLabel}>• Pompa ASI, breast pad, nipple cream</Text><Text style={styles.tableRowValue}>Lengkap</Text></View>
                            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}><Text style={styles.tableRowLabel}>• Sandal kamar hangat & perlengkapan mandi</Text><Text style={styles.tableRowValue}>Lengkap</Text></View>
                          </>
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.footerPageNum}>{leftNum}</Text>
                    <Text style={styles.footerBookTitle}>bunda. — Jurnal Kehamilan</Text>
                    <Text style={styles.footerChapter}>Bab 3 • Checklist</Text>
                  </View>
                </View>
              </Page>

              <Page size="B5" style={styles.page}>
                <View style={styles.pageBorderFrame} />
                <View style={styles.innerPageContainer}>
                  <View>
                    <View style={styles.topHeaderBar}>
                      <View>
                        <Text style={styles.topHeaderCategory}>BAB 3: PERSIAPAN</Text>
                        <Text style={styles.topHeaderTitle}>
                          {isSpread43 ? 'Daftar Belanja Mandi & Perawatan' : 'Checklist Tas RS: Bayi & Ayah'}
                        </Text>
                      </View>
                      <View style={styles.topHeaderBadge}>
                        <Text style={styles.topHeaderBadgeText}>{isSpread43 ? 'PERAWATAN' : 'BAYI & AYAH'}</Text>
                      </View>
                    </View>

                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Kelengkapan Pendukung</Text>
                        <Text style={styles.cardHeaderSubtext}>Penting & Wajib</Text>
                      </View>
                      <View style={[styles.cardBody, { paddingVertical: 4 }]}>
                        {isSpread43 ? (
                          <>
                            <View style={styles.tableRow}><Text style={styles.tableRowLabel}>• Bak mandi bayi ergonomis & perlak anti air</Text><Text style={styles.tableRowValue}>Siap</Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableRowLabel}>• Handuk microfiber ultra-lembut newborn</Text><Text style={styles.tableRowValue}>2 pcs</Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableRowLabel}>• Sabun & sampo 2-in-1 khusus newborn</Text><Text style={styles.tableRowValue}>Siap</Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableRowLabel}>• Minyak telon hangat & baby lotion</Text><Text style={styles.tableRowValue}>Siap</Text></View>
                            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}><Text style={styles.tableRowLabel}>• Kasa steril & kapas pembersih tali pusat</Text><Text style={styles.tableRowValue}>Siap</Text></View>
                          </>
                        ) : (
                          <>
                            <View style={styles.tableRow}><Text style={styles.tableRowLabel}>• 1 set baju pulang bayi, selimut topi & topi</Text><Text style={styles.tableRowValue}>Siap</Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableRowLabel}>• Car seat newborn terpasang aman di mobil</Text><Text style={styles.tableRowValue}>Siap</Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableRowLabel}>• Baju ganti Ayah & jaket hangat</Text><Text style={styles.tableRowValue}>Siap</Text></View>
                            <View style={styles.tableRow}><Text style={styles.tableRowLabel}>• Kamera, charger HP & powerbank</Text><Text style={styles.tableRowValue}>Siap</Text></View>
                            <View style={[styles.tableRow, { borderBottomWidth: 0 }]}><Text style={styles.tableRowLabel}>• Camilan energi tinggi & air minum hangat</Text><Text style={styles.tableRowValue}>Siap</Text></View>
                          </>
                        )}
                      </View>
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.footerPageNum}>{rightNum}</Text>
                    <Text style={styles.footerBookTitle}>bunda. — Jurnal Kehamilan</Text>
                    <Text style={styles.footerChapter}>Bab 3 • Checklist</Text>
                  </View>
                </View>
              </Page>
            </React.Fragment>
          );
        }

        // --------------------------------------------------------------------
        // SPREAD 45: HALAMAN 91 & 92 (Bab 4: Kisah Persalinan & IMD)
        // --------------------------------------------------------------------
        if (sIdx === 45) {
          const laborStory = bab4Data?.laborStory || 'Setiap gelombang cinta kontraksi bunda hadapi dengan napas panjang. Ayah membisikkan doa dan memegang tangan bunda tanpa sedetik pun melepaskannya. Seluruh rasa sakit sirna seketika saat terdengar tangisan pertamamu yang merdu di ruang bersalin.';
          const holdingFeeling = bab4Data?.holdingBabyFeeling || 'Kulit hangatmu diletakkan di dada bunda. Mata manismu berkedip perlahan mencari aroma pelukan ini. Selamat datang di dunia, buah hatiku tersayang...';

          return (
            <React.Fragment key={`spread-${sIdx}`}>
              <Page size="B5" style={styles.page}>
                <View style={styles.pageBorderFrame} />
                <View style={styles.innerPageContainer}>
                  <View>
                    <View style={styles.topHeaderBar}>
                      <View>
                        <Text style={styles.topHeaderCategory}>BAB 4: HARI KELAHIRAN</Text>
                        <Text style={styles.topHeaderTitle}>Kisah Perjuangan Persalinan</Text>
                      </View>
                      <View style={styles.topHeaderBadge}>
                        <Text style={styles.topHeaderBadgeText}>PERSALINAN</Text>
                      </View>
                    </View>

                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Kronologi Hari Spesial</Text>
                        <Text style={styles.cardHeaderSubtext}>Waktu Masuk RS</Text>
                      </View>
                      <View style={[styles.cardBody, { paddingVertical: 4 }]}>
                        <View style={styles.tableRow}>
                          <Text style={styles.tableRowLabel}>Kontraksi Pertama Dirasakan:</Text>
                          <Text style={styles.tableRowValue}>{bab4Data?.contractionTime || 'Pukul 02:30 Dini Hari'}</Text>
                        </View>
                        <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                          <Text style={styles.tableRowLabel}>Tiba di Rumah Sakit Bersalin:</Text>
                          <Text style={styles.tableRowValue}>{bab4Data?.arrivalTime || 'Pukul 05:45 Subuh'}</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Kisah di Ruang Bersalin</Text>
                        <Text style={styles.cardHeaderSubtext}>Perjuangan Ibu & Ayah</Text>
                      </View>
                      <View style={styles.cardBody}>
                        <Text style={{ fontFamily: 'Times-Roman', fontSize: 8.5, color: '#292524', lineHeight: 1.45 }}>
                          {laborStory}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.footerPageNum}>91</Text>
                    <Text style={styles.footerBookTitle}>bunda. — Jurnal Kehamilan</Text>
                    <Text style={styles.footerChapter}>Bab 4 • Persalinan</Text>
                  </View>
                </View>
              </Page>

              <Page size="B5" style={styles.page}>
                <View style={styles.pageBorderFrame} />
                <View style={styles.innerPageContainer}>
                  <View>
                    <View style={styles.topHeaderBar}>
                      <View>
                        <Text style={styles.topHeaderCategory}>BAB 4: HARI KELAHIRAN</Text>
                        <Text style={styles.topHeaderTitle}>Dekapan Hangat Pertama (IMD)</Text>
                      </View>
                      <View style={styles.topHeaderBadge}>
                        <Text style={styles.topHeaderBadgeText}>INISIASI MENYUSU DINI</Text>
                      </View>
                    </View>

                    <View style={styles.polaroidContainer}>
                      <View style={styles.washiTape} />
                      <View style={[styles.polaroidImageHolder, { height: 110 }]}>
                        {bab4Data?.birthPhoto ? (
                          <Image src={bab4Data.birthPhoto} style={styles.polaroidImage} />
                        ) : (
                          <Text style={{ fontFamily: 'Helvetica', fontSize: 7.5, color: '#78716C' }}>
                            [ Foto Dekapan Pertama di Ruang Bersalin ]
                          </Text>
                        )}
                      </View>
                      <Text style={styles.polaroidCaption}>Kulit ke kulit, detak ke detak — perjumpaan pertama yang tak tergantikan</Text>
                    </View>

                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Perasaan Saat Mendekapmu</Text>
                        <Text style={styles.cardHeaderSubtext}>Sentuhan Kasih</Text>
                      </View>
                      <View style={styles.cardBody}>
                        <Text style={{ fontFamily: 'Times-Roman', fontSize: 8.5, color: '#292524', lineHeight: 1.45 }}>
                          {holdingFeeling}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.footerPageNum}>92</Text>
                    <Text style={styles.footerBookTitle}>bunda. — Jurnal Kehamilan</Text>
                    <Text style={styles.footerChapter}>Bab 4 • Dekapan Pertama</Text>
                  </View>
                </View>
              </Page>
            </React.Fragment>
          );
        }

        // --------------------------------------------------------------------
        // SPREAD 46: HALAMAN 93 & 94 (Bab 4: Biodata Bayi & Cap Kaki)
        // --------------------------------------------------------------------
        if (sIdx === 46) {
          const babyName = bab4Data?.babyName || babyNickname;
          const birthDate = bab4Data?.birthDate || hplDate;
          const birthTime = bab4Data?.birthTime || '09:18 WIB';
          const birthWeight = bab4Data?.birthWeight || '3.350 gram';
          const birthLength = bab4Data?.birthLength || '50 cm';
          const headCircumference = bab4Data?.headCircumference || '34 cm';
          const bloodType = bab4Data?.bloodType || 'O (Rhesus Positif)';

          return (
            <React.Fragment key={`spread-${sIdx}`}>
              {/* HALAMAN 93: BIODATA */}
              <Page size="B5" style={styles.page}>
                <View style={styles.pageBorderFrame} />
                <View style={styles.innerPageContainer}>
                  <View>
                    <View style={styles.topHeaderBar}>
                      <View>
                        <Text style={styles.topHeaderCategory}>BAB 4: HARI KELAHIRAN</Text>
                        <Text style={styles.topHeaderTitle}>Lembar Biodata Resmi Bayi</Text>
                      </View>
                      <View style={styles.topHeaderBadge}>
                        <Text style={styles.topHeaderBadgeText}>AKTA KENANGAN</Text>
                      </View>
                    </View>

                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Nama Resmi Sang Buah Hati</Text>
                        <Text style={styles.cardHeaderSubtext}>Penuh Berkah</Text>
                      </View>
                      <View style={[styles.cardBody, { alignItems: 'center', paddingVertical: 8 }]}>
                        <Text style={{ fontFamily: 'Times-Bold', fontSize: 18, color: '#1C1917', marginBottom: 2 }}>
                          {babyName}
                        </Text>
                        <Text style={{ fontFamily: 'Times-Italic', fontSize: 9, color: '#556B2F' }}>
                          Selamat datang ke dunia, penyejuk jiwa kami
                        </Text>
                      </View>
                    </View>

                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Data Fisik Kelahiran</Text>
                        <Text style={styles.cardHeaderSubtext}>Catatan Dokter</Text>
                      </View>
                      <View style={[styles.cardBody, { paddingVertical: 4 }]}>
                        <View style={styles.tableRow}><Text style={styles.tableRowLabel}>Tanggal Lahir:</Text><Text style={styles.tableRowValue}>{birthDate}</Text></View>
                        <View style={styles.tableRow}><Text style={styles.tableRowLabel}>Waktu Kelahiran:</Text><Text style={styles.tableRowValue}>{birthTime}</Text></View>
                        <View style={styles.tableRow}><Text style={styles.tableRowLabel}>Berat Badan Lahir:</Text><Text style={styles.tableRowValue}>{birthWeight}</Text></View>
                        <View style={styles.tableRow}><Text style={styles.tableRowLabel}>Panjang Badan:</Text><Text style={styles.tableRowValue}>{birthLength}</Text></View>
                        <View style={styles.tableRow}><Text style={styles.tableRowLabel}>Lingkar Kepala:</Text><Text style={styles.tableRowValue}>{headCircumference}</Text></View>
                        <View style={[styles.tableRow, { borderBottomWidth: 0 }]}><Text style={styles.tableRowLabel}>Golongan Darah:</Text><Text style={styles.tableRowValue}>{bloodType}</Text></View>
                      </View>
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.footerPageNum}>93</Text>
                    <Text style={styles.footerBookTitle}>bunda. — Jurnal Kehamilan</Text>
                    <Text style={styles.footerChapter}>Bab 4 • Biodata Bayi</Text>
                  </View>
                </View>
              </Page>

              {/* HALAMAN 94: CAP KAKI */}
              <Page size="B5" style={styles.page}>
                <View style={styles.pageBorderFrame} />
                <View style={styles.innerPageContainer}>
                  <View>
                    <View style={styles.topHeaderBar}>
                      <View>
                        <Text style={styles.topHeaderCategory}>BAB 4: HARI KELAHIRAN</Text>
                        <Text style={styles.topHeaderTitle}>Jejak Cap Kaki Mungil</Text>
                      </View>
                      <View style={styles.topHeaderBadge}>
                        <Text style={styles.topHeaderBadgeText}>LANGKAH PERTAMA</Text>
                      </View>
                    </View>

                    <View style={styles.trackerGrid}>
                      <View style={styles.trackerCol}>
                        <View style={[styles.polaroidContainer, { height: 185 }]}>
                          <View style={styles.washiTape} />
                          <View style={[styles.polaroidImageHolder, { height: 145 }]}>
                            {bab4Data?.leftFootprint ? (
                              <Image src={bab4Data.leftFootprint} style={styles.polaroidImage} />
                            ) : (
                              <Text style={{ fontFamily: 'Helvetica', fontSize: 7.5, color: '#78716C' }}>
                                [ Cap Kaki Kiri ]
                              </Text>
                            )}
                          </View>
                          <Text style={styles.polaroidCaption}>Kaki Kiri</Text>
                        </View>
                      </View>

                      <View style={styles.trackerCol}>
                        <View style={[styles.polaroidContainer, { height: 185 }]}>
                          <View style={styles.washiTape} />
                          <View style={[styles.polaroidImageHolder, { height: 145 }]}>
                            {bab4Data?.rightFootprint ? (
                              <Image src={bab4Data.rightFootprint} style={styles.polaroidImage} />
                            ) : (
                              <Text style={{ fontFamily: 'Helvetica', fontSize: 7.5, color: '#78716C' }}>
                                [ Cap Kaki Kanan ]
                              </Text>
                            )}
                          </View>
                          <Text style={styles.polaroidCaption}>Kaki Kanan</Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.milestoneCard}>
                      <Text style={styles.milestoneTitle}>DOA LANGKAH KEHIDUPAN</Text>
                      <Text style={styles.milestoneQuote}>
                        "Langkah kecil pertamamu di dunia yang luas, diiringi cinta tak bertepi dari ayah dan bunda."
                      </Text>
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.footerPageNum}>94</Text>
                    <Text style={styles.footerBookTitle}>bunda. — Jurnal Kehamilan</Text>
                    <Text style={styles.footerChapter}>Bab 4 • Cap Kaki</Text>
                  </View>
                </View>
              </Page>
            </React.Fragment>
          );
        }

        // --------------------------------------------------------------------
        // SPREAD 47: HALAMAN 95 & 96 (Bab 4: Gelang RS & Foto Keluarga)
        // --------------------------------------------------------------------
        if (sIdx === 47) {
          return (
            <React.Fragment key={`spread-${sIdx}`}>
              <Page size="B5" style={styles.page}>
                <View style={styles.pageBorderFrame} />
                <View style={styles.innerPageContainer}>
                  <View>
                    <View style={styles.topHeaderBar}>
                      <View>
                        <Text style={styles.topHeaderCategory}>BAB 4: HARI KELAHIRAN</Text>
                        <Text style={styles.topHeaderTitle}>Gelang Pengenal Rumah Sakit</Text>
                      </View>
                      <View style={styles.topHeaderBadge}>
                        <Text style={styles.topHeaderBadgeText}>KENANGAN ABADI</Text>
                      </View>
                    </View>

                    <View style={styles.polaroidContainer}>
                      <View style={styles.washiTape} />
                      <View style={[styles.polaroidImageHolder, { height: 90 }]}>
                        {bab4Data?.babyWristbandPhoto ? (
                          <Image src={bab4Data.babyWristbandPhoto} style={styles.polaroidImage} />
                        ) : (
                          <Text style={{ fontFamily: 'Helvetica', fontSize: 7.5, color: '#78716C' }}>
                            [ Foto Gelang Identitas Bayi ]
                          </Text>
                        )}
                      </View>
                      <Text style={styles.polaroidCaption}>Gelang Pengenal Bayi Baru Lahir</Text>
                    </View>

                    <View style={styles.polaroidContainer}>
                      <View style={styles.washiTape} />
                      <View style={[styles.polaroidImageHolder, { height: 90 }]}>
                        {bab4Data?.momWristbandPhoto ? (
                          <Image src={bab4Data.momWristbandPhoto} style={styles.polaroidImage} />
                        ) : (
                          <Text style={{ fontFamily: 'Helvetica', fontSize: 7.5, color: '#78716C' }}>
                            [ Foto Gelang Pasien Bunda ]
                          </Text>
                        )}
                      </View>
                      <Text style={styles.polaroidCaption}>Gelang Pasien Ruang Bersalin Bunda</Text>
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.footerPageNum}>95</Text>
                    <Text style={styles.footerBookTitle}>bunda. — Jurnal Kehamilan</Text>
                    <Text style={styles.footerChapter}>Bab 4 • Gelang RS</Text>
                  </View>
                </View>
              </Page>

              <Page size="B5" style={styles.page}>
                <View style={styles.pageBorderFrame} />
                <View style={styles.innerPageContainer}>
                  <View>
                    <View style={styles.topHeaderBar}>
                      <View>
                        <Text style={styles.topHeaderCategory}>BAB 4: HARI KELAHIRAN</Text>
                        <Text style={styles.topHeaderTitle}>Foto Pertama Keluarga Bertiga</Text>
                      </View>
                      <View style={styles.topHeaderBadge}>
                        <Text style={styles.topHeaderBadgeText}>KELUARGA UTUH</Text>
                      </View>
                    </View>

                    <View style={styles.polaroidContainer}>
                      <View style={styles.washiTape} />
                      <View style={[styles.polaroidImageHolder, { height: 165 }]}>
                        {bab4Data?.familyPhoto ? (
                          <Image src={bab4Data.familyPhoto} style={styles.polaroidImage} />
                        ) : (
                          <Text style={{ fontFamily: 'Helvetica', fontSize: 7.5, color: '#78716C' }}>
                            [ Foto Keluarga Pertama Bertiga ]
                          </Text>
                        )}
                      </View>
                      <Text style={styles.polaroidCaption}>Hari saat keluarga kecil kita menjadi utuh, sempurna, dan penuh cinta</Text>
                    </View>

                    <View style={styles.milestoneCard}>
                      <Text style={styles.milestoneTitle}>RUMAH CINTA KITA</Text>
                      <Text style={styles.milestoneQuote}>
                        "Hari saat cinta menemukan bentuk terindahnya, menyatukan ayah, bunda, dan dirimu selamanya."
                      </Text>
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.footerPageNum}>96</Text>
                    <Text style={styles.footerBookTitle}>bunda. — Jurnal Kehamilan</Text>
                    <Text style={styles.footerChapter}>Bab 4 • Foto Keluarga</Text>
                  </View>
                </View>
              </Page>
            </React.Fragment>
          );
        }

        // --------------------------------------------------------------------
        // SPREAD 48: HALAMAN 97 & 98 (Bab 5: Surat Bunda)
        // --------------------------------------------------------------------
        if (sIdx === 48) {
          const bundaP1 = bab5Data?.bundaLetterPart1 || 'Anakku sayang,\nSaat kamu membaca surat ini kelak, jemarimu sudah jauh lebih besar dari jemari mungil yang dulu bunda genggam erat di ruang bersalin. Waktu berlalu begitu cepat, nak.\n\nBunda menulis lembaran ini saat kamu baru beberapa hari terlelap damai di dada bunda. Ketahuilah, sejak hari pertama tahu kehadiranmu, doa bunda tidak pernah berhenti mengalir untuk setiap helaan napasmu.';
          const bundaP2 = bab5Data?.bundaLetterPart2 || 'Jadilah pribadi yang berhati lembut, teguh membela kebenaran, dan selalu bersyukur atas hal-hal sederhana. Di saat dunia luar terasa begitu bising dan melelahkan, ingatlah bahwa pelukan bunda dan rumah ini akan selalu menjadi dermaga teraman tempatmu berlabuh pulang.\n\nTerima kasih telah memilih bunda menjadi ibumu di dunia ini. Kamu adalah anugerah dan kebanggaan terbesar dalam hidup bunda.';
          const bundaSign = bab5Data?.bundaSignName || ownerName;

          return (
            <React.Fragment key={`spread-${sIdx}`}>
              <Page size="B5" style={styles.page}>
                <View style={styles.pageBorderFrame} />
                <View style={styles.innerPageContainer}>
                  <View>
                    <View style={styles.topHeaderBar}>
                      <View>
                        <Text style={styles.topHeaderCategory}>BAB 5: KAPSUL WAKTU</Text>
                        <Text style={styles.topHeaderTitle}>Surat Wasiat Cinta dari Bunda (I)</Text>
                      </View>
                      <View style={styles.topHeaderBadge}>
                        <Text style={styles.topHeaderBadgeText}>UNTUK BUAH HATI</Text>
                      </View>
                    </View>

                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Pesan Kasih Bunda • Bagian Pertama</Text>
                        <Text style={styles.cardHeaderSubtext}>Dibuka Saat Dewasa</Text>
                      </View>
                      <View style={[styles.cardBody, { padding: 10 }]}>
                        <Text style={{ fontFamily: 'Times-Roman', fontSize: 8.8, color: '#292524', lineHeight: 1.55 }}>
                          {bundaP1}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.footerPageNum}>97</Text>
                    <Text style={styles.footerBookTitle}>bunda. — Jurnal Kehamilan</Text>
                    <Text style={styles.footerChapter}>Bab 5 • Surat Bunda</Text>
                  </View>
                </View>
              </Page>

              <Page size="B5" style={styles.page}>
                <View style={styles.pageBorderFrame} />
                <View style={styles.innerPageContainer}>
                  <View>
                    <View style={styles.topHeaderBar}>
                      <View>
                        <Text style={styles.topHeaderCategory}>BAB 5: KAPSUL WAKTU</Text>
                        <Text style={styles.topHeaderTitle}>Surat Wasiat Cinta dari Bunda (II)</Text>
                      </View>
                      <View style={styles.topHeaderBadge}>
                        <Text style={styles.topHeaderBadgeText}>DOA KEHIDUPAN</Text>
                      </View>
                    </View>

                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Pesan Kasih Bunda • Bagian Kedua</Text>
                        <Text style={styles.cardHeaderSubtext}>Dermaga Pulang Teraman</Text>
                      </View>
                      <View style={[styles.cardBody, { padding: 10 }]}>
                        <Text style={{ fontFamily: 'Times-Roman', fontSize: 8.8, color: '#292524', lineHeight: 1.55 }}>
                          {bundaP2}
                        </Text>
                      </View>
                    </View>

                    <View style={{ alignItems: 'flex-end', paddingRight: 12, marginTop: 14 }}>
                      <Text style={{ fontFamily: 'Times-Italic', fontSize: 9.5, color: '#78716C' }}>Dengan cinta abadi bunda,</Text>
                      <Text style={{ fontFamily: 'Times-Bold', fontSize: 13, color: '#1C1917', marginTop: 3 }}>{bundaSign}</Text>
                      <View style={{ width: 90, height: 0.75, backgroundColor: '#D6D3D1', marginTop: 2 }} />
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.footerPageNum}>98</Text>
                    <Text style={styles.footerBookTitle}>bunda. — Jurnal Kehamilan</Text>
                    <Text style={styles.footerChapter}>Bab 5 • Surat Bunda</Text>
                  </View>
                </View>
              </Page>
            </React.Fragment>
          );
        }

        // --------------------------------------------------------------------
        // SPREAD 49: HALAMAN 99 & 100 (Bab 5: Surat Ayah)
        // --------------------------------------------------------------------
        if (sIdx === 49) {
          const ayahP1 = bab5Data?.ayahLetterPart1 || 'Wahai buah hatiku,\nAyah mungkin tidak selalu pandai merangkai kata seindah bundamu. Namun ketahuilah, di setiap tetes peluh kerja keras ayah, namamu selalu hadir dalam sujud doa.\n\nAyah ingin kamu tumbuh menjadi insan yang jujur, berani bermimpi besar, dan selalu rendah hati dalam melangkah.';
          const ayahP2 = bab5Data?.ayahLetterPart2 || 'Jangan pernah takut gagal, nak. Gagal adalah tanda bahwa kamu sedang berjuang menggapai cita-cita mulia. Ayah akan selalu ada di belakangmu, menjadi dinding kokoh yang menopang langkahmu.\n\nHormatilah bundamu yang telah mengandungmu selama 9 bulan penuh perjuangan suci. Bahagiakan dia di setiap hembusan usiamu.\n\nDengan rasa bangga yang tak terhingga,\nAyahmu.';
          const ayahSign = bab5Data?.ayahSignName || 'Ayah Tercinta';

          return (
            <React.Fragment key={`spread-${sIdx}`}>
              <Page size="B5" style={styles.page}>
                <View style={styles.pageBorderFrame} />
                <View style={styles.innerPageContainer}>
                  <View>
                    <View style={styles.topHeaderBar}>
                      <View>
                        <Text style={styles.topHeaderCategory}>BAB 5: KAPSUL WAKTU</Text>
                        <Text style={styles.topHeaderTitle}>Surat Harapan dari Ayah (I)</Text>
                      </View>
                      <View style={styles.topHeaderBadge}>
                        <Text style={styles.topHeaderBadgeText}>PESAN AYAH</Text>
                      </View>
                    </View>

                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Surat Harapan Ayah • Bagian Pertama</Text>
                        <Text style={styles.cardHeaderSubtext}>Kebanggaan & Integritas</Text>
                      </View>
                      <View style={[styles.cardBody, { padding: 10 }]}>
                        <Text style={{ fontFamily: 'Times-Roman', fontSize: 8.8, color: '#292524', lineHeight: 1.55 }}>
                          {ayahP1}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.footerPageNum}>99</Text>
                    <Text style={styles.footerBookTitle}>bunda. — Jurnal Kehamilan</Text>
                    <Text style={styles.footerChapter}>Bab 5 • Surat Ayah</Text>
                  </View>
                </View>
              </Page>

              <Page size="B5" style={styles.page}>
                <View style={styles.pageBorderFrame} />
                <View style={styles.innerPageContainer}>
                  <View>
                    <View style={styles.topHeaderBar}>
                      <View>
                        <Text style={styles.topHeaderCategory}>BAB 5: KAPSUL WAKTU</Text>
                        <Text style={styles.topHeaderTitle}>Surat Harapan dari Ayah (II)</Text>
                      </View>
                      <View style={styles.topHeaderBadge}>
                        <Text style={styles.topHeaderBadgeText}>DINDING KOKOH</Text>
                      </View>
                    </View>

                    <View style={styles.cardContainer}>
                      <View style={styles.cardHeader}>
                        <Text style={styles.cardHeaderText}>Surat Harapan Ayah • Bagian Kedua</Text>
                        <Text style={styles.cardHeaderSubtext}>Doa & Nasihat Hidup</Text>
                      </View>
                      <View style={[styles.cardBody, { padding: 10 }]}>
                        <Text style={{ fontFamily: 'Times-Roman', fontSize: 8.8, color: '#292524', lineHeight: 1.55 }}>
                          {ayahP2}
                        </Text>
                      </View>
                    </View>

                    <View style={{ alignItems: 'flex-end', paddingRight: 12, marginTop: 14 }}>
                      <Text style={{ fontFamily: 'Times-Italic', fontSize: 9.5, color: '#78716C' }}>Dengan rasa bangga dan pelukan hangat,</Text>
                      <Text style={{ fontFamily: 'Times-Bold', fontSize: 13, color: '#1C1917', marginTop: 3 }}>{ayahSign}</Text>
                      <View style={{ width: 90, height: 0.75, backgroundColor: '#D6D3D1', marginTop: 2 }} />
                    </View>
                  </View>

                  <View style={styles.footer}>
                    <Text style={styles.footerPageNum}>100</Text>
                    <Text style={styles.footerBookTitle}>bunda. — Jurnal Kehamilan</Text>
                    <Text style={styles.footerChapter}>Bab 5 • Surat Ayah</Text>
                  </View>
                </View>
              </Page>
            </React.Fragment>
          );
        }

        // Fallback generic page
        return (
          <React.Fragment key={`spread-${sIdx}`}>
            <Page size="B5" style={styles.page}>
              <View style={styles.pageBorderFrame} />
              <View style={styles.innerPageContainer}>
                <View>
                  <View style={styles.topHeaderBar}>
                    <View>
                      <Text style={styles.topHeaderCategory}>BUKU KENANGAN</Text>
                      <Text style={styles.topHeaderTitle}>{spread.chapterTitle}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.footer}>
                  <Text style={styles.footerPageNum}>{leftNum}</Text>
                  <Text style={styles.footerBookTitle}>bunda.</Text>
                  <Text style={styles.footerChapter}>{spread.chapterTitle}</Text>
                </View>
              </View>
            </Page>
            <Page size="B5" style={styles.page}>
              <View style={styles.pageBorderFrame} />
              <View style={styles.innerPageContainer}>
                <View>
                  <View style={styles.topHeaderBar}>
                    <View>
                      <Text style={styles.topHeaderCategory}>BUKU KENANGAN</Text>
                      <Text style={styles.topHeaderTitle}>{spread.chapterTitle}</Text>
                    </View>
                  </View>
                </View>
                <View style={styles.footer}>
                  <Text style={styles.footerPageNum}>{rightNum}</Text>
                  <Text style={styles.footerBookTitle}>bunda.</Text>
                  <Text style={styles.footerChapter}>{spread.chapterTitle}</Text>
                </View>
              </View>
            </Page>
          </React.Fragment>
        );
      })}
    </Document>
  );
};

export default JournalPdfDocument;
