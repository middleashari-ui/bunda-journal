# META-PARAMETERS — Katalog Parameter Meta Ads

**Produk:** Ruang Iklan untuk Bunda Journal  
**Versi:** 0.1 (draft review) · **Tanggal:** 16 Nov 2026  
**Graph API:** `v27.0` (dipin)  
**Dokumen terkait:** [PRD](./PRD.md) · [TRD](./TRD.md) · [CALCULATOR-SPEC](./CALCULATOR-SPEC.md)

> Tujuan dokumen ini: memastikan **tidak ada parameter penting yang hilang** dari
> dashboard, tanpa menjadikan dashboard sebagai metric wall. Prinsipnya:
> **semua parameter bisa diakses**, tetapi hanya sebagian yang ditampilkan default.

---

## 1. Cara katalog ini dipakai

| Kolom | Arti |
|---|---|
| **Sync** | `default` = ditarik setiap sync; `ondemand` = hanya saat dibutuhkan; `-` = tidak disinkronkan |
| **Display** | `default` = muncul di tabel/kartu; `picker` = tersedia lewat “Tambah kolom”; `advanced` = raw JSON |
| **Level** | Level objek tempat field valid |
| **Catatan** | Batasan, estimasi, atau peringatan |

Aturan:

1. **Sync ≠ display.** Jangan menarik 100 field hanya karena bisa.
2. Mengubah field sync memicu konfirmasi + re-sync.
3. Field yang tidak tersedia di akun (mis. fitur belum aktif) ditandai `unavailable`,
   bukan `0`.
4. Field `estimated` diberi label; jangan dipakai untuk keputusan uang.
5. Field yang deprecated tidak ditampilkan; simpan di changelog.

---

## 2. Akun (`/act_{id}`)

| Field | Label | Tipe | Sync | Display | Catatan |
|---|---|---|---|---|---|
| `id` | Ad account ID | string | default | advanced | `act_...` |
| `account_id` | Account ID | string | default | advanced | Tanpa prefix |
| `name` | Nama akun | string | default | default | |
| `business_name` | Nama bisnis | string | default | picker | |
| `currency` | Mata uang | string | default | default | IDR default |
| `timezone_name` | Timezone | string | default | default | Tanggal mengikuti ini |
| `account_status` | Status akun | enum | default | default | 1 aktif, 2 disabled, 3 unsettled, 7 risk, 8 settlement, 9 grace, 100/101 closed |
| `disable_reason` | Alasan disable | enum | default | picker | Tampilkan jika status ≠1 |
| `balance` | Saldo | money | default | picker | Bisa negatif |
| `amount_spent` | Total spend | money | default | picker | Lifetime |
| `spend_cap` | Batas spend | money | default | picker | 10 perubahan/hari |
| `funding_source_details` | Sumber dana | object | ondemand | advanced | Jangan tampilkan nomor kartu |
| `created_time` | Dibuat | datetime | default | advanced | |
| `min_daily_budget` | Minimum budget harian | money | ondemand | advanced | |
| `is_prepay_account` | Prepay | bool | default | advanced | |
| `tax_id_status` | Status pajak | enum | ondemand | advanced | |
| `owner` | Owner | string | ondemand | advanced | |
| `capabilities` | Kapabilitas | array | ondemand | advanced | |
| `business` | Business | object | ondemand | advanced | |
| `adtrust_dsl` | Ad trust | object | - | - | Tidak dipakai |

---

## 3. Campaign (`/act_{id}/campaigns`)

| Field | Label | Tipe | Sync | Display | Catatan |
|---|---|---|---|---|---|
| `id` | Campaign ID | string | default | advanced | |
| `name` | Nama campaign | string | default | default | |
| `objective` | Objective | enum | default | default | `OUTCOME_SALES`, `OUTCOME_TRAFFIC`, `OUTCOME_ENGAGEMENT`, `OUTCOME_AWARENESS`, `OUTCOME_LEADS`, `OUTCOME_APP_PROMOTION` |
| `status` | Status | enum | default | default | `ACTIVE`, `PAUSED`, `DELETED`, `ARCHIVED` |
| `effective_status` | Status efektif | enum | default | default | Termasuk review/learning |
| `configured_status` | Status setting | enum | default | picker | |
| `buying_type` | Buying type | enum | default | picker | `AUCTION`, `RESERVED` |
| `daily_budget` | Budget harian | money | default | default | Bisa di campaign (CBO) |
| `lifetime_budget` | Budget lifetime | money | default | picker | |
| `budget_remaining` | Sisa budget | money | default | picker | |
| `spend_cap` | Spend cap | money | ondemand | picker | |
| `start_time` | Mulai | datetime | default | picker | |
| `stop_time` | Selesai | datetime | default | picker | |
| `created_time` | Dibuat | datetime | default | advanced | |
| `updated_time` | Diubah | datetime | default | advanced | |
| `special_ad_categories` | Kategori khusus | array | default | picker | Politik, kredit, dll |
| `special_ad_category_country` | Negara kategori | array | ondemand | advanced | |
| `bid_strategy` | Bid strategy | enum | default | picker | `LOWEST_COST_WITHOUT_CAP`, `COST_CAP`, `TARGET_COST`, dll |
| `advantage_campaign_budget_optimization` | Advantage CBO | bool | ondemand | picker | |
| `is_skadnetwork_attribution` | SKAdNetwork | bool | ondemand | advanced | |
| `source_campaign_id` | Source | string | ondemand | advanced | |
| `issues_info` | Masalah | array | default | default | Tampilkan jika ada |
| `top_line_id` | Top line | string | - | - | |
| `smart_promotion_type` | Smart promo | enum | ondemand | advanced | |

---

## 4. Ad set (`/act_{id}/adsets`)

| Field | Label | Tipe | Sync | Display | Catatan |
|---|---|---|---|---|---|
| `id` | Ad set ID | string | default | advanced | |
| `name` | Nama ad set | string | default | default | |
| `campaign_id` | Campaign | string | default | default | |
| `status` | Status | enum | default | default | |
| `effective_status` | Status efektif | enum | default | default | |
| `configured_status` | Status setting | enum | default | picker | |
| `optimization_goal` | Optimization goal | enum | default | default | `OFFSITE_CONVERSIONS`, `VALUE`, `LEAD_GENERATION`, `LINK_CLICKS`, `LANDING_PAGE_VIEWS`, `REACH`, `IMPRESSIONS`, `THRUPLAY`, `CONVERSATIONS`, dll |
| `billing_event` | Billing event | enum | default | picker | `IMPRESSIONS`, `LINK_CLICKS`, `THRUPLAY`, dll |
| `bid_amount` | Bid amount | money | default | picker | |
| `bid_strategy` | Bid strategy | enum | default | picker | |
| `daily_budget` | Budget harian | money | default | default | Minor unit |
| `lifetime_budget` | Budget lifetime | money | default | picker | |
| `budget_schedule` | Jadwal budget | array | ondemand | advanced | |
| `pacing_type` | Pacing | array | default | picker | `standard`, `no_pacing` |
| `targeting` | Targeting | object | default | advanced | Lihat §5 |
| `attribution_spec` | Atribusi | array | default | picker | Window per ad set |
| `destination_type` | Destination | enum | default | picker | `WEBSITE`, `MESSENGER`, `WHATSAPP`, `INSTAGRAM_DIRECT`, `ON_AD`, dll |
| `promoted_object` | Promoted object | object | default | advanced | Pixel, Page, app |
| `start_time` | Mulai | datetime | default | picker | |
| `end_time` | Selesai | datetime | default | picker | |
| `created_time` | Dibuat | datetime | default | advanced | |
| `updated_time` | Diubah | datetime | default | advanced | |
| `frequency_control_specs` | Frequency cap | array | ondemand | picker | |
| `is_dynamic_creative` | Dynamic creative | bool | default | picker | |
| `multi_optimization_goal_weight` | Multi-goal | object | ondemand | advanced | |
| `dsa_beneficiary` | DSA beneficiary | string | ondemand | advanced | Uni Eropa |
| `dsa_payor` | DSA payor | string | ondemand | advanced | Uni Eropa |
| `recurring_budget_semantics` | Recurring | bool | ondemand | advanced | |
| `source_adset_id` | Source | string | ondemand | advanced | |
| `use_new_app_click` | New app click | bool | ondemand | advanced | |
| `lifetime_min_spend_target` | Min spend target | money | ondemand | advanced | |
| `lifetime_spend_cap` | Spend cap | money | ondemand | advanced | |

---

## 5. Targeting (nested di ad set)

### 5.1 Lokasi

| Field | Label | Sync | Display | Catatan |
|---|---|---|---|---|
| `geo_locations.countries` | Negara | default | default | ID default |
| `geo_locations.regions` | Provinsi | default | picker | |
| `geo_locations.cities` | Kota | default | picker | |
| `geo_locations.zips` | Kode pos | ondemand | advanced | |
| `geo_locations.custom_locations` | Custom location | ondemand | advanced | |
| `geo_locations.geo_markets` | Geo market | ondemand | advanced | |
| `geo_locations.location_types` | Tipe lokasi | default | picker | `home`, `recent`, `travel_in` |
| `geo_locations.radius` | Radius | ondemand | advanced | |
| `geo_locations.distance_unit` | Unit | ondemand | advanced | |
| `excluded_geo_locations` | Exclude lokasi | default | picker | |

### 5.2 Demografi

| Field | Label | Sync | Display | Catatan |
|---|---|---|---|---|
| `age_min` | Usia min | default | picker | 18–65 |
| `age_max` | Usia max | default | picker | |
| `genders` | Gender | default | picker | 1 male, 2 female |
| `locales` | Bahasa | ondemand | advanced | |
| `relationship_statuses` | Status hubungan | ondemand | advanced | |
| `life_events` | Life event | ondemand | advanced | |
| `family_statuses` | Status keluarga | ondemand | advanced | Relevan untuk ibu |
| `friends_of_connections` | Teman koneksi | ondemand | advanced | |
| `industries` | Industri | ondemand | advanced | |
| `income` | Income | ondemand | advanced | |
| `education` | Pendidikan | ondemand | advanced | |
| `education_majors` | Jurusan | ondemand | advanced | |
| `education_schools` | Sekolah | ondemand | advanced | |
| `education_statuses` | Status pendidikan | ondemand | advanced | |
| `college_years` | Tahun kuliah | ondemand | advanced | |
| `work_employers` | Employer | ondemand | advanced | |
| `work_positions` | Posisi | ondemand | advanced | |
| `interested_in` | Tertarik pada | ondemand | advanced | |
| `user_os` | OS | ondemand | advanced | |
| `user_device` | Device | ondemand | advanced | |
| `wireless_carrier` | Carrier | ondemand | advanced | |
| `device_platforms` | Platform device | default | picker | `mobile`, `desktop` |
| `excluded_user_device` | Exclude device | ondemand | advanced | |

### 5.3 Minat, perilaku, audiens

| Field | Label | Sync | Display | Catatan |
|---|---|---|---|---|
| `interests` | Minat | default | default | Array `{id,name}` |
| `behaviors` | Perilaku | default | picker | |
| `demographics` | Demografi | default | picker | |
| `flexible_spec` | Flexible spec | default | advanced | Kombinasi AND/OR |
| `exclusions` | Exclusions | default | advanced | |
| `excluded_interests` | Exclude minat | ondemand | advanced | |
| `excluded_behaviors` | Exclude perilaku | ondemand | advanced | |
| `excluded_demographics` | Exclude demografi | ondemand | advanced | |
| `custom_audiences` | Custom audience | default | default | |
| `excluded_custom_audiences` | Exclude custom | default | picker | |
| `lookalike_audience` | Lookalike | ondemand | picker | |
| `lookalike_spec` | Lookalike spec | ondemand | advanced | |
| `retargeting_spec` | Retargeting | ondemand | advanced | |
| `product_audience_specs` | Product audience | ondemand | advanced | |
| `excluded_product_audience_specs` | Exclude product | ondemand | advanced | |
| `connections` | Connections | ondemand | advanced | |
| `excluded_connections` | Exclude connections | ondemand | advanced | |

### 5.4 Placement

| Field | Label | Sync | Display | Catatan |
|---|---|---|---|---|
| `publisher_platforms` | Platform | default | default | `facebook`, `instagram`, `audience_network`, `messenger` |
| `facebook_positions` | Posisi FB | default | picker | `feed`, `story`, `reels`, `video_feeds`, `search`, `marketplace`, dll |
| `instagram_positions` | Posisi IG | default | picker | `stream`, `story`, `reels`, `explore`, dll |
| `audience_network_positions` | Posisi AN | default | picker | |
| `messenger_positions` | Posisi Messenger | default | picker | |
| `device_platforms` | Device | default | picker | |
| `brand_safety_content_filter_levels` | Brand safety | ondemand | advanced | |
| `excluded_brand_safety_list` | Exclude brand safety | ondemand | advanced | |
| `publisher_exclusions` | Publisher exclusion | ondemand | advanced | |
| `excluded_publisher_categories` | Exclude kategori | ondemand | advanced | |
| `excluded_publisher_list` | Exclude publisher | ondemand | advanced | |

### 5.5 Automation

| Field | Label | Sync | Display | Catatan |
|---|---|---|---|---|
| `targeting_automation` | Targeting automation | ondemand | advanced | |
| `advantage_audience` | Advantage audience | default | picker | 0/1 |
| `individual_setting` | Individual setting | ondemand | advanced | |
| `app_install_state` | App install state | ondemand | advanced | |
| `targeting_relaxation_types` | Relaxation | ondemand | advanced | |
| `is_advantage_audience` | Is Advantage | ondemand | advanced | |

---

## 6. Ad (`/act_{id}/ads`)

| Field | Label | Tipe | Sync | Display | Catatan |
|---|---|---|---|---|---|
| `id` | Ad ID | string | default | advanced | |
| `name` | Nama ad | string | default | default | |
| `adset_id` | Ad set | string | default | default | |
| `campaign_id` | Campaign | string | default | default | |
| `status` | Status | enum | default | default | |
| `effective_status` | Status efektif | enum | default | default | |
| `configured_status` | Status setting | enum | default | picker | |
| `creative_id` | Creative ID | string | default | advanced | |
| `creative` | Creative | object | default | advanced | Bisa di-expand |
| `tracking_specs` | Tracking specs | array | ondemand | advanced | |
| `conversion_domain` | Domain konversi | string | default | picker | |
| `issues_info` | Masalah | array | default | default | Iklan ditolak |
| `preview_shareable_link` | Preview link | string | ondemand | advanced | Jangan diekspos publik |
| `source_ad_id` | Source | string | ondemand | advanced | |
| `ad_review_feedback` | Review feedback | object | ondemand | picker | |
| `adlabels` | Label | array | ondemand | advanced | |
| `execution_options` | Execution | array | ondemand | advanced | |
| `recommendations` | Rekomendasi Meta | array | - | - | Bisa dimatikan |
| `created_time` | Dibuat | datetime | default | advanced | |
| `updated_time` | Diubah | datetime | default | advanced | |

---

## 7. Creative (`/act_{id}/adcreatives`)

| Field | Label | Tipe | Sync | Display | Catatan |
|---|---|---|---|---|---|
| `id` | Creative ID | string | default | advanced | |
| `name` | Nama creative | string | default | default | |
| `title` | Judul | string | default | picker | |
| `body` | Body | string | default | picker | |
| `image_url` | Gambar | url | default | default | Proxy/allowlist |
| `image_hash` | Image hash | string | ondemand | advanced | |
| `video_id` | Video ID | string | default | advanced | |
| `thumbnail_url` | Thumbnail | url | default | default | Proxy |
| `object_story_id` | Story ID | string | ondemand | advanced | |
| `object_story_spec` | Story spec | object | default | advanced | Link/video/photo data |
| `asset_feed_spec` | Asset feed | object | default | advanced | Dynamic creative |
| `degrees_of_freedom_spec` | DOF | object | ondemand | advanced | Advantage+ creative |
| `url_tags` | URL tags | string | default | picker | UTM |
| `call_to_action_type` | CTA | enum | default | picker | `SHOP_NOW`, `LEARN_MORE`, `SIGN_UP`, `MESSAGE_PAGE`, dll |
| `page_id` | Page | string | default | picker | |
| `instagram_actor_id` | IG actor | string | ondemand | advanced | |
| `effective_object_story_id` | Effective story | string | ondemand | advanced | |
| `creative_facebook_post` | FB post | object | ondemand | advanced | |
| `instagram_permalink_url` | IG permalink | url | ondemand | advanced | |
| `object_type` | Tipe objek | enum | ondemand | advanced | |
| `status` | Status | enum | default | picker | |
| `account_id` | Account | string | default | advanced | |
| `branded_content` | Branded content | object | ondemand | advanced | |
| `product_set_id` | Product set | string | ondemand | advanced | |
| `template_url` | Template URL | url | ondemand | advanced | |
| `link_destination_display_url` | Display URL | url | ondemand | advanced | |
| `source_instagram_media_id` | IG media | string | ondemand | advanced | |
| `platform_customizations` | Customization | object | ondemand | advanced | |
| `portrait_customizations` | Portrait | object | ondemand | advanced | |
| `reauthorize_status` | Reauth | enum | - | - | |

### 7.1 Subfield creative yang penting

| Subfield | Isi | Ditampilkan |
|---|---|---|
| `object_story_spec.page_id` | Page | picker |
| `object_story_spec.link_data.message` | Primary text | picker |
| `object_story_spec.link_data.name` | Headline | picker |
| `object_story_spec.link_data.description` | Description | picker |
| `object_story_spec.link_data.image_hash` | Gambar | default |
| `object_story_spec.link_data.call_to_action` | CTA | picker |
| `object_story_spec.video_data.video_id` | Video | advanced |
| `object_story_spec.video_data.message` | Video text | picker |
| `object_story_spec.video_data.title` | Video title | picker |
| `object_story_spec.video_data.call_to_action` | CTA | picker |
| `asset_feed_spec.bodies` | Variasi body | advanced |
| `asset_feed_spec.titles` | Variasi title | advanced |
| `asset_feed_spec.descriptions` | Variasi description | advanced |
| `asset_feed_spec.images` | Variasi gambar | advanced |
| `asset_feed_spec.videos` | Variasi video | advanced |
| `asset_feed_spec.call_to_action_types` | Variasi CTA | advanced |
| `asset_feed_spec.ad_formats` | Format | advanced |
| `asset_feed_spec.optimization_type` | Optimasi | advanced |
| `asset_feed_spec.asset_customization_rules` | Rules | advanced |

Catatan: creative bisa berisi banyak aset (dynamic creative). Dashboard menampilkan
**satu baris per ad**, bukan per aset, kecuali mode “asset breakdown” (P1).

---

## 8. Insights (metrik)

### 8.1 Dasar

| Field | Label | Sync | Display | Catatan |
|---|---|---|---|---|
| `spend` | Spend | default | default | |
| `impressions` | Impressions | default | default | |
| `reach` | Reach | default | picker | Non-additive |
| `frequency` | Frequency | default | default | `impressions/reach` |
| `cpm` | CPM | default | picker | |
| `cpc` | CPC | default | picker | All clicks |
| `cpp` | CPP | default | picker | |
| `ctr` | CTR | default | picker | All clicks |
| `clicks` | Clicks | default | picker | |
| `unique_clicks` | Unique clicks | ondemand | advanced | |
| `social_spend` | Social spend | ondemand | advanced | |
| `objective` | Objective | default | picker | |
| `date_start` | Tanggal mulai | default | default | |
| `date_stop` | Tanggal selesai | default | default | |
| `account_id` | Account | default | advanced | |
| `campaign_id` | Campaign | default | default | |
| `adset_id` | Ad set | default | picker | |
| `ad_id` | Ad | default | picker | |
| `account_name` | Nama akun | default | advanced | |
| `campaign_name` | Nama campaign | default | advanced | |
| `adset_name` | Nama ad set | default | advanced | |
| `ad_name` | Nama ad | default | advanced | |

### 8.2 Klik & landing page

| Field | Label | Sync | Display | Catatan |
|---|---|---|---|---|
| `inline_link_clicks` | Link clicks | default | default | |
| `inline_link_click_ctr` | Link CTR | default | default | |
| `outbound_clicks` | Outbound clicks | default | default | |
| `outbound_clicks_ctr` | Outbound CTR | default | default | |
| `unique_inline_link_clicks` | Unique link clicks | ondemand | advanced | |
| `cost_per_inline_link_click` | Cost/link click | default | picker | |
| `cost_per_outbound_click` | Cost/outbound click | default | picker | |
| `cost_per_unique_click` | Cost/unique click | ondemand | advanced | |
| `cost_per_unique_inline_link_click` | Cost/unique link | ondemand | advanced | |
| `landing_page_views` | LPV | default | default | |
| `cost_per_landing_page_view` | Cost/LPV | default | picker | |

### 8.3 Konversi

| Field | Label | Sync | Display | Catatan |
|---|---|---|---|---|
| `actions` | Actions | default | advanced | Array |
| `action_values` | Action values | default | advanced | Array |
| `conversions` | Conversions | ondemand | advanced | |
| `conversion_values` | Conversion values | ondemand | advanced | |
| `purchase_roas` | Purchase ROAS | default | picker | Array |
| `cost_per_action_type` | Cost/action | default | advanced | |
| `cost_per_unique_action_type` | Cost/unique action | ondemand | advanced | |
| `cost_per_conversion` | Cost/conversion | ondemand | advanced | |
| `cost_per_purchase` | Cost/purchase | default | picker | |
| `cost_per_lead` | Cost/lead | default | picker | |
| `cost_per_messaging_conversation_started` | Cost/chat | default | picker | |
| `adds_to_cart` | Add to cart | default | picker | |
| `cost_per_add_to_cart` | Cost/ATC | default | picker | |
| `initiates_checkout` | Checkout | default | picker | |
| `cost_per_initiate_checkout` | Cost/checkout | default | picker | |
| `purchases` | Purchases | default | default | Platform |
| `leads` | Leads | default | picker | |
| `messaging_conversations_started` | Chat started | default | picker | |
| `onsite_conversion.messaging_conversation_started_7d` | Chat 7d | ondemand | advanced | WhatsApp/Messenger |

### 8.4 Video

| Field | Label | Sync | Display | Catatan |
|---|---|---|---|---|
| `video_play_actions` | Video plays | default | picker | |
| `video_p25_watched_actions` | 25% | default | picker | |
| `video_p50_watched_actions` | 50% | default | picker | |
| `video_p75_watched_actions` | 75% | default | picker | |
| `video_p95_watched_actions` | 95% | default | picker | |
| `video_p100_watched_actions` | 100% | default | picker | |
| `video_thruplay_watched_actions` | ThruPlay | default | default | Hold rate |
| `video_avg_time_watched_actions` | Avg time | default | picker | |
| `video_30_sec_watched_actions` | 30s views | ondemand | picker | |
| `video_time_watched_actions` | Total time | ondemand | advanced | |

### 8.5 Kualitas & lain-lain

| Field | Label | Sync | Display | Catatan |
|---|---|---|---|---|
| `quality_ranking` | Quality ranking | default | default | `ABOVE_AVERAGE`, dll |
| `engagement_rate_ranking` | Engagement ranking | default | picker | |
| `conversion_rate_ranking` | Conversion ranking | default | picker | |
| `estimated_ad_recall_rate` | Ad recall | ondemand | advanced | Estimasi |
| `estimated_ad_recallers` | Recallers | ondemand | advanced | Estimasi |
| `full_view_impressions` | Full view | ondemand | advanced | |
| `full_view_reach` | Full view reach | ondemand | advanced | |
| `frequency_value` | Frequency value | ondemand | advanced | Butuh breakdown |
| `attribution_setting` | Attribution | default | default | Label di chart |
| `conversion_bits` | Conversion bits | ondemand | advanced | |
| `total_postbacks` | Postbacks | ondemand | advanced | |
| `total_postbacks_detailed` | Postbacks detail | ondemand | advanced | |
| `skan_campaign_id` | SKAN campaign | ondemand | advanced | |
| `skan_conversion_id` | SKAN conversion | ondemand | advanced | |

---

## 9. Breakdowns

| Breakdown | Label | Sync | Display | Catatan |
|---|---|---|---|---|
| `age` | Usia | ondemand | default | |
| `gender` | Gender | ondemand | default | |
| `age,gender` | Usia + gender | ondemand | default | Kombinasi umum |
| `country` | Negara | ondemand | picker | |
| `region` | Provinsi | ondemand | picker | |
| `dma` | DMA | ondemand | advanced | US only |
| `publisher_platform` | Platform | ondemand | default | |
| `platform_position` | Posisi | ondemand | default | |
| `impression_device` | Device | ondemand | picker | Bisa perlu enable |
| `device_platform` | Mobile/desktop | ondemand | picker | |
| `action_device` | Device konversi | ondemand | picker | |
| `action_type` | Tipe aksi | ondemand | advanced | |
| `action_target_id` | Target aksi | ondemand | advanced | |
| `action_destination` | Destinasi | ondemand | advanced | |
| `product_id` | Produk | ondemand | picker | Butuh katalog |
| `image_asset` | Gambar | ondemand | picker | Dynamic creative |
| `video_asset` | Video | ondemand | picker | Dynamic creative |
| `body_asset` | Body | ondemand | advanced | Dynamic creative |
| `title_asset` | Title | ondemand | advanced | Dynamic creative |
| `call_to_action_asset` | CTA | ondemand | advanced | Dynamic creative |
| `link_url_asset` | URL | ondemand | advanced | Dynamic creative |
| `hourly_stats_aggregated_by_advertiser_time_zone` | Per jam (advertiser) | ondemand | picker | 13 bulan |
| `hourly_stats_aggregated_by_audience_time_zone` | Per jam (audience) | ondemand | picker | 13 bulan |
| `frequency_value` | Frequency value | ondemand | advanced | Perlu enable |
| `user_segment_key` | New/existing | ondemand | advanced | ASC |
| `pa_creator_ig_handle` | Creator | ondemand | advanced | Partnership ads |

Catatan:

- `age`/`gender` tidak kompatibel dengan semua metrik off-Meta.
- `reach` untuk breakdown >13 bulan tidak tersedia.
- Satu call per kombinasi breakdown; jangan gabungkan yang tidak kompatibel.
- Breakdown disimpan 30 hari; jangan sync semua dimensi setiap hari.

---

## 10. Action types (pemetaan konversi)

| Action type | Label | Dipakai untuk |
|---|---|---|
| `purchase` | Purchase | Konversi utama |
| `offsite_conversion.fb_pixel_purchase` | Pixel purchase | Konversi utama |
| `omni_purchase` | Omni purchase | Alternatif |
| `onsite_web_purchase` | Web purchase | Alternatif |
| `lead` | Lead | Form |
| `offsite_conversion.fb_pixel_lead` | Pixel lead | Form |
| `complete_registration` | Complete registration | Signup |
| `offsite_conversion.fb_pixel_complete_registration` | Pixel complete reg | Signup |
| `add_to_cart` | Add to cart | Funnel |
| `offsite_conversion.fb_pixel_add_to_cart` | Pixel ATC | Funnel |
| `initiate_checkout` | Initiate checkout | Funnel |
| `offsite_conversion.fb_pixel_initiate_checkout` | Pixel checkout | Funnel |
| `landing_page_view` | LPV | Funnel |
| `link_click` | Link click | Engagement |
| `post_engagement` | Post engagement | Engagement |
| `video_view` | Video view | Video |
| `messaging_conversation_started_7d` | Chat 7d | WhatsApp |
| `onsite_conversion.messaging_conversation_started_7d` | Onsite chat 7d | WhatsApp |
| `onsite_conversion.total_messaging_connection` | Total chat | WhatsApp |
| `onsite_conversion.lead_grouped` | Lead grouped | Form |
| `onsite_conversion.post_save` | Post save | Engagement |
| `onsite_conversion.post_net_like` | Post like | Engagement |
| `onsite_conversion.post_net_comment` | Post comment | Engagement |
| `onsite_conversion.post_net_share` | Post share | Engagement |
| `offsite_conversion.fb_pixel_view_content` | View content | Funnel |
| `offsite_conversion.fb_pixel_search` | Search | Funnel |
| `offsite_conversion.fb_pixel_add_payment_info` | Add payment | Funnel |
| `offsite_conversion.fb_pixel_add_to_wishlist` | Wishlist | Funnel |
| `offsite_conversion.fb_pixel_subscribe` | Subscribe | Funnel |
| `offsite_conversion.fb_pixel_start_trial` | Start trial | Funnel |
| `offsite_conversion.fb_pixel_custom` | Custom | Custom |

Urutan fallback purchase: `offsite_conversion.fb_pixel_purchase` → `purchase` →
`omni_purchase` → `onsite_web_purchase`.

---

## 11. Pixel / CAPI

| Field/Objek | Label | Sync | Display | Catatan |
|---|---|---|---|---|
| `pixel.id` | Pixel ID | default | default | |
| `pixel.name` | Nama pixel | default | picker | |
| `pixel.code` | Kode | ondemand | advanced | |
| `pixel.creation_time` | Dibuat | default | advanced | |
| `pixel.last_fired_time` | Terakhir fire | default | default | Tracking health |
| `pixel.is_created_by_app` | Dibuat app | ondemand | advanced | |
| `pixel.owner_business` | Owner business | ondemand | advanced | |
| `pixel.owner_ad_account` | Owner ad account | ondemand | advanced | |
| `pixel.automatic_matching_fields` | Auto matching | ondemand | advanced | |
| `pixel.data_use_setting` | Data use | ondemand | advanced | |
| `pixel.first_party_cookie_status` | 1P cookie | ondemand | advanced | |
| `pixel.enable_automatic_matching` | Auto match | ondemand | advanced | |
| `pixel.server_events_business_id` | Server events | ondemand | advanced | |
| `pixel.is_unavailable` | Unavailable | ondemand | default | Banner jika true |
| `capi.event_name` | Event | default | default | Purchase/Lead |
| `capi.event_time` | Waktu | default | default | |
| `capi.event_id` | Event ID | default | advanced | Dedup |
| `capi.action_source` | Source | default | picker | `website` |
| `capi.event_source_url` | URL | default | advanced | |
| `capi.user_data.em` | Email hash | default | advanced | Jangan tampil mentah |
| `capi.user_data.ph` | Phone hash | default | advanced | |
| `capi.user_data.external_id` | External ID | default | advanced | |
| `capi.user_data.fbc/fbp` | Click/browser ID | default | advanced | |
| `capi.custom_data.value` | Value | default | default | |
| `capi.custom_data.currency` | Currency | default | default | IDR |
| `capi.custom_data.content_ids` | Produk | default | picker | |
| `capi.custom_data.order_id` | Order ID | default | default | |
| `capi.test_event_code` | Test code | manual | advanced | Jangan produksi |

**EMQ:** tidak ada API publik yang stabil untuk skor EMQ. Dashboard memakai
“Tracking Health” dari log CAPI + gap bank/Meta, dan input manual jika owner
melihat EMQ di Events Manager.

---

## 12. Page organic (P1)

| Field | Label | Sync | Display | Catatan |
|---|---|---|---|---|
| `page.id` | Page ID | default | default | |
| `page.name` | Nama Page | default | default | |
| `page.fan_count` | Fans (likes) | default | default | Field objek Page |
| `page.followers_count` | Followers | default | default | Field objek Page |
| `page_impressions` | Impressions | ondemand | picker | Page Insights |
| `page_impressions_unique` | Reach | ondemand | picker | Page Insights |
| `page_engaged_users` | Engaged users | ondemand | picker | Page Insights |
| `page_views_total` | Page views | ondemand | picker | Page Insights |
| `page_post_engagements` | Post engagement | ondemand | picker | Page Insights |
| `page_actions_post_reactions_total` | Reactions | ondemand | picker | Page Insights |
| `page_posts_impressions` | Post impressions | ondemand | picker | Page Insights |
| `page_posts_impressions_unique` | Post reach | ondemand | picker | Page Insights |
| `page_video_views` | Video views | ondemand | picker | Page Insights |
| `page_video_complete_views_30s` | Video 30s | ondemand | picker | Page Insights |
| `page_fans` | Fans total | ondemand | picker | Page Insights |
| `page_fan_adds` | Fan adds | ondemand | picker | Page Insights |
| `page_fan_removes` | Fan removes | ondemand | picker | Page Insights |

Butuh Page token dengan `read_insights` + `pages_read_engagement`. Nama metrik di atas
adalah **Page Insights**, bukan Ads Insights; jangan dicampur dengan tabel campaign.

---

## 13. Audience & targeting explorer (P1)

| Endpoint | Fungsi | Output | Catatan |
|---|---|---|---|
| `GET /act_{id}/targetingsearch` | Cari minat/perilaku/demografi | `id, name, audience_size_lower_bound, audience_size_upper_bound, path, description, type` | Rate limit; cache 7 hari |
| `GET /act_{id}/reachestimate` | Estimasi reach | `users_lower_bound, users_upper_bound, estimate_ready, unsupported_reasons` | Butuh targeting spec |
| `GET /act_{id}/delivery_estimate` | Estimasi delivery/CPM | `daily_outcomes_curve, estimate_dau, estimate_mau_*`, `recommended_bid` | Untuk perencanaan |
| `GET /act_{id}/adinterest` | Detail minat | `id, name, audience_size` | |
| `GET /act_{id}/adsets` + `targeting` | Audit overlap | Targeting tiap adset | Hitung overlap manual |

Fitur ini P1: “Audience Planner” untuk melihat reach dan CPM range sebelum membuat
adset. Bukan untuk membuat targeting otomatis di MVP.

---

## 14. Ad rules (P2)

| Field | Label | Catatan |
|---|---|---|
| `id` | Rule ID | |
| `name` | Nama rule | |
| `evaluation_spec` | Kondisi | Mis. CPA > X |
| `execution_spec` | Aksi | Pause/notify |
| `schedule_spec` | Jadwal | |
| `status` | Status | |

Dashboard **tidak** memakai Meta ad rules untuk guardrail utama; guardrail dihitung
sendiri agar bisa memakai CPA bank. Ad rules bisa ditampilkan sebagai referensi.

---

## 15. Field governance

1. **Katalog versioned** (`META_PARAMETER_CATALOG_VERSION`), disimpan sebagai JSON
   statis di `src/ads/lib/catalog.ts` dan `functions/_lib/ads/fields.ts`.
2. **Sync default** ~40 field; field lain on-demand. Menambah field default butuh
   alasan + ukur payload.
3. **Rate limit:** setiap field tambahan memperbesar query; jangan minta semua
   breakdown sekaligus.
4. **Deprecated:** field yang dihapus Meta ditandai `deprecated` dan tidak dipakai;
   changelog diupdate.
5. **Estimated:** field estimasi (reach breakdown, recall) diberi label; jangan
   dipakai untuk keputusan uang.
6. **Raw JSON:** hanya mode Advanced; tidak berisi token; di-redact.
7. **Permission:** field yang butuh scope tambahan menampilkan “butuh izin”; jangan
   menampilkan 0.

---

## 16. Checklist “semua parameter”

| Kelompok | Status |
|---|---|
| Akun (status, currency, timezone, spend cap) | ✅ katalog + sync |
| Campaign (objective, budget, bid strategy, status) | ✅ |
| Ad set (optimization, billing, budget, pacing, attribution) | ✅ |
| Targeting (geo, demografi, minat, audiens, placement, automation) | ✅ katalog; sebagian on-demand |
| Ad (status, creative, issues) | ✅ |
| Creative (story spec, asset feed, CTA, URL tags) | ✅ |
| Insights dasar & klik | ✅ |
| Insights konversi & ROAS | ✅ |
| Insights video | ✅ |
| Breakdowns (age, gender, placement, region, device, hourly) | ✅ on-demand |
| Action types | ✅ mapping |
| Pixel/CAPI | ✅ log + health |
| Page organic | ✅ P1 |
| Audience/targeting search | ✅ P1 |
| Ad rules | ✅ P2 referensi |
| Raw JSON per objek | ✅ advanced |

**Yang tidak ditampilkan default** bukan berarti hilang: semuanya ada di katalog,
column picker, detail drawer, atau raw JSON. Ini supaya dashboard tetap bisa dibaca
tanpa scroll 40 kolom.
