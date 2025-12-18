# Jahongir Travel Website Transformation Roadmap
## From Generic Tour Operator to Craft Tourism Specialist

**Document Version:** 1.0  
**Date:** December 2025  
**Author:** MVP Product Manager Agent  

---

## EXECUTIVE SUMMARY

**Transformation Objective:** Pivot from 20+ generic Uzbekistan tours to 3-5 curated craft tourism experiences, targeting textile enthusiasts, ceramic artists, and purposeful travelers.

**Core Strategy:** Depth over breadth, artisan partnerships over tourist attractions, transformation over sightseeing.

**Timeline:** 
- MVP (Phase 1): 2-3 weeks
- Phase 2: 1-2 months  
- Phase 3: 3+ months

**Total Effort:** ~487 hours over 6 months  
**Estimated Budget:** $14,450-24,050

---

## PHASE 1: MVP (2-3 WEEKS) - Quick Positioning Shift

**Goal:** Immediately communicate new positioning without major development work.

### 1.1 Homepage Transformation (Week 1)

#### Hero Section - CRITICAL CHANGE
**Current:** "Discover Uzbekistan's Treasures" + Generic landscape  
**New:** "Live the Craft. Meet the Masters. Preserve the Tradition."

**Changes:**
- Replace hero image: Landscape → Close-up of artisan hands at work (silk ikat weaving or ceramic painting)
- New headline: "Living Artisan's Journey" + subheadline: "Small-group craft immersion in Uzbekistan (Max 6 travelers)"
- CTA change: "Book Now" → "Explore Craft Journeys" or "Find Your Artisan Path"

**Implementation:** 
- Blade template: `resources/views/home/hero.blade.php` (or similar)
- Update: Hero image, headline text, CTA button
- **Effort:** 2 hours

#### Why Choose Us Section - REFRAME
**Current:** Generic USPs (experienced guides, comfortable hotels, etc.)  
**New:** Craft tourism differentiators

**Replace with 4 pillars:**
1. **Small Groups (Max 6)** - "Unlike mass tours, you get artisan facetime"
2. **Multi-Day Workshops** - "Not demos. Real learning with master craftspeople"
3. **Artisan Homestays** - "Sleep where silk is woven, eat with pottery families"
4. **Preservation Mission** - "Your tour funds endangered craft revival (UNESCO partnership)"

**Visual:** Icons → Artisan portraits with craft they practice  
**Effort:** 3 hours

#### "Trending Activities" → "Craft Calendar" Section
**Current:** Generic activities (city tours, silk road, etc.)  
**New:** Seasonal craft experiences

**Content:**
- **Spring (March-May):** Silk cocoon harvesting + natural dyeing workshops
- **Summer (June-Aug):** Ceramic firing season in Rishtan kilns
- **Autumn (Sept-Nov):** Cotton harvest + ikat weaving intensive
- **Winter (Dec-Feb):** Indoor crafts - embroidery, miniature painting

**Effort:** 4 hours

#### "Popular Tours" → "Curated Craft Journeys" Section
**Current:** 20+ tours displayed  
**New:** 3-5 flagship craft tours

**Starter tours:**
1. **Silk Road Artisan Trail** (10 days) - Margilan silk + Bukhara embroidery
2. **Ceramic Masters Intensive** (7 days) - Rishtan pottery immersion
3. **Textile Traditions Deep Dive** (14 days) - Ikat weaving + suzani
4. **[Coming Soon] Miniature Painting Retreat** (5 days)
5. **[Custom] Bespoke Artisan Journey** - Design your own

**Card design changes:**
- Add badge: "Max 6 travelers"
- Add stat: "12 hours artisan time"
- Change price display: "From $2,800 (all-inclusive)"

**Effort:** 6 hours

#### Top Destinations → "Our Artisan Hubs"
**Current:** City cards (Samarkand, Bukhara, Khiva)  
**New:** Reframe cities through craft lens

**Example:**
- **Margilan** - "Silk Capital: Meet 6 generations of ikat weavers"
- **Rishtan** - "Ceramics Village: 300 pottery families"
- **Bukhara** - "Embroidery Epicenter: Gold thread suzani masters"

**Effort:** 3 hours

**Total Homepage Effort:** ~22 hours

---

### 1.2 Tours Page Overhaul (Week 1-2)

#### Archive Strategy for Old Tours
**Implementation:**
1. Add `is_craft_tour` boolean field to tours table
2. Filter tours page to show only craft tours by default
3. Add "Browse All Tours" toggle for old tours

**Effort:** 3 hours

#### New Tour Card Information
**Add to tour cards:**
- Craft type badge
- Group size: "4/6 spots filled"
- Workshop hours: "18 hours hands-on"
- Skill level indicator
- Artisan count: "Learn from 5 masters"
- Seasonal tag: "Best: April-October"

**Effort:** 5 hours

#### Filters Redesign
**New filters:**
- Craft Type (Ceramics, Textiles, Metalwork, Multi-craft)
- Duration (5-7, 8-10, 11-14, 14+ days)
- Skill Level (Beginner, Intermediate, Advanced)
- Season (Spring, Summer, Autumn, Winter)

**Effort:** 6 hours

#### Tour Detail Page Enhancements
**Add sections:**
1. "Meet Your Artisan Mentors" - Artisan bios with photos
2. "Workshop Breakdown" - Day-by-day learning outcomes
3. "What You'll Create" - Portfolio of past work
4. "Group Dynamics" - Small group benefits
5. "Preservation Impact" - Mission storytelling

**Effort:** 8 hours

**Total Tours Page Effort:** ~22 hours

---

### 1.3 Content Quick Wins (Week 2-3)

#### Blog: 3 Craft-Focused Articles
1. **"How to Choose Your First Craft Journey"** (1,200 words) - 5 hours
2. **"Meet Master Abdullo: 6th Generation Ikat Weaver"** (1,500 words) - 6 hours
3. **"3-Day Ceramic Workshop in Rishtan"** (1,000 words) - 4 hours

**Total:** 15 hours

#### About Us Page - REWRITE
**New structure:**
1. Opening: "We're craft preservationists who run tours"
2. The Problem: Endangered crafts, artisan poverty
3. Our Solution: Small groups, fair pay, apprentice funding
4. Our Impact: "23 artisans supported, 8 apprentices trained"
5. Partnerships: UNESCO, local guilds

**Effort:** 4 hours

---

### PHASE 1 SUMMARY

**Total Effort:** ~96 hours (~2.5 weeks)

**Deliverables:**
- ✅ Homepage transformed
- ✅ Tours page showing craft journeys
- ✅ 3 craft-focused blog articles
- ✅ About page rewritten
- ✅ 20-30 artisan photos sourced

**Success Metrics:**
- Homepage bounce rate < 60%
- Session duration > 3 minutes
- 3-5 tour inquiries

---

## PHASE 2: ENHANCED CONTENT & FEATURES (1-2 MONTHS)

### 2.1 New Page: "Our Artisan Partners" (Week 4-5)

**Database Schema:**
```sql
CREATE TABLE artisans (
  id INT PRIMARY KEY,
  name VARCHAR(255),
  slug VARCHAR(255),
  craft_type VARCHAR(100),
  region VARCHAR(100),
  years_experience INT,
  specialization TEXT,
  bio TEXT,
  photo_url VARCHAR(255),
  fun_fact TEXT,
  apprentices_trained INT
);

CREATE TABLE artisan_tour (
  artisan_id INT,
  tour_id INT
);
```

**Page content:**
- Artisan cards grid (10-15 profiles)
- Filters by craft/region
- "Tours featuring this artisan" links

**Effort:** 42 hours (12 dev + 30 content)

---

### 2.2 New Page: "Craft Calendar" (Week 5-6)

**Content:**
- Monthly breakdown of seasonal opportunities
- Craft festival dates
- Optimal travel times per craft
- Interactive calendar UI

**Effort:** 18 hours (8 dev + 10 content)

---

### 2.3 Blog Content Expansion (Week 4-12)

**3 Content Pillars:**

1. **Artisan Stories** (Monthly) - 1,500-2,000 words - 6 hours each
2. **Craft Technique Deep-Dives** (Bi-weekly) - 1,200-1,500 words - 5 hours each
3. **Travel Tips** (Weekly) - 800-1,000 words - 3 hours each

**Publishing schedule:**
- 2 artisan stories (12 hours)
- 4 technique guides (20 hours)
- 8 travel tips (24 hours)

**Total:** 56 hours

---

### 2.4 Trust Signals (Week 6-7)

**Add:**
1. Partnership badges (UNESCO, guilds)
2. Impact metrics dashboard
3. Alumni showcase gallery
4. Media mentions section

**Effort:** 15-19 hours

---

### 2.5 Enhanced Tour Features (Week 7-8)

1. **Skill Level Quiz** - Interactive tour recommender - 6 hours
2. **Tour Comparison Tool** - Side-by-side comparison - 8 hours
3. **Waitlist Functionality** - For sold-out tours - 5 hours

**Total:** 19 hours

---

### 2.6 SEO Optimization (Week 8-9)

**Tasks:**
- Schema markup for tours
- Meta descriptions optimization
- Image alt text
- XML sitemap
- Internal linking strategy
- 5 pillar pages for target keywords

**Effort:** 33 hours

---

### PHASE 2 SUMMARY

**Total Effort:** ~183-187 hours (~5-6 weeks)

**Deliverables:**
- ✅ Artisan Partners page (10-15 profiles)
- ✅ Craft Calendar page
- ✅ 14 new blog articles
- ✅ Trust signal sections
- ✅ Tour comparison & quiz tools
- ✅ SEO optimization complete

**Success Metrics:**
- Organic traffic +30%
- Conversion rate > 3%
- Time on site > 5 minutes

---

## PHASE 3: ADVANCED FEATURES (3+ MONTHS)

### 3.1 Video Content Library (Month 3-4)

**Content:**
- 10-15 artisan documentaries (10-15 min each)
- Workshop preview videos (2-3 min each)
- YouTube hosting + website embeds

**Budget:** $500-800 per video  
**Effort:** 60 hours

---

### 3.2 Community & Social Proof (Month 3-5)

1. **Alumni Platform** - Private community for past travelers - 5 hours
2. **Instagram Strategy** - UGC content pillars - 3 hours/week
3. **Video Testimonials** - Collection system - 8 hours

**Total:** 13 hours + ongoing

---

### 3.3 Advanced Booking & CRM (Month 4-6)

**Features:**
- Deposit options (30% now, 70% later)
- Group booking discounts
- Payment plans (3 installments)
- Travel insurance integration
- HubSpot/Pipedrive CRM
- Email automation workflows

**Effort:** 45 hours

---

### 3.4 Interactive Itinerary Builder (Month 5-6)

**Feature:** "Design Your Bespoke Journey"

**User flow:**
1. Select crafts of interest
2. Choose artisans to learn from
3. Set duration
4. Add preferences
5. Get custom quote

**Effort:** 50 hours

---

### 3.5 Performance Optimization (Month 6)

**Tasks:**
- Image lazy loading & compression
- CSS/JS minification
- Laravel caching
- CDN setup (Cloudflare)
- Google Analytics 4 events
- Heatmaps (Hotjar)
- A/B testing (Google Optimize)

**Effort:** 22 hours

---

### PHASE 3 SUMMARY

**Total Effort:** ~208 hours (~2-3 months)

**Deliverables:**
- ✅ Video library (10-15 videos)
- ✅ Alumni community
- ✅ Advanced booking flow
- ✅ Bespoke itinerary builder
- ✅ Performance optimization
- ✅ Content automation

**Success Metrics:**
- Conversion rate > 5%
- Average booking > $3,000
- Repeat customers > 15%
- Organic traffic +100%

---

## FULL ROADMAP TIMELINE

| Phase | Timeline | Effort | Key Deliverables |
|-------|----------|--------|------------------|
| **Phase 1: MVP** | Weeks 1-3 | 96 hours | Homepage, tours, blog, photos |
| **Phase 2: Enhanced** | Weeks 4-12 | 183 hours | Artisan pages, calendar, SEO |
| **Phase 3: Advanced** | Months 3-6 | 208 hours | Video, community, automation |
| **TOTAL** | 6 months | **487 hours** | Full craft tourism platform |

---

## BUDGET ESTIMATES

### Phase 1 (MVP)
- Photography: $300-500
- Stock photos: $100
- Copywriting: $200-400
- Developer time (40 hrs): $1,200-2,000
- **Total:** $1,800-3,000

### Phase 2 (Enhanced)
- Photography: $500-800
- Videography: $1,000-1,500 (optional)
- Copywriting (14 articles): $700-1,400
- SEO tools: $100-200/month
- Developer time (60 hrs): $1,800-3,000
- **Total:** $4,100-6,900

### Phase 3 (Advanced)
- Video production (10-15): $5,000-8,000
- CRM platform: $50-100/month
- Email platform: $0-50/month
- Developer time (100 hrs): $3,000-5,000
- Social media ads: $500-1,000
- **Total:** $8,550-14,150

### TOTAL BUDGET (6 Months)
**Low:** $14,450  
**High:** $24,050  
**Average:** ~$19,000

---

## QUICK WINS (Week 1 - 16 hours)

Can be implemented immediately:

1. **Homepage Hero Swap** (2 hours)
   - New headline: "Living Artisan's Journey"
   - Replace hero image
   - Update CTA

2. **About Page Rewrite** (4 hours)
   - Mission-driven narrative
   - Impact metrics

3. **"Craft Tours" Filter** (3 hours)
   - Toggle on tours page
   - Tag 3-5 existing tours

4. **First Blog Article** (5 hours)
   - "How to Choose Your First Craft Journey"

5. **Navigation Update** (1 hour)
   - "Tours" → "Craft Journeys"

6. **Trust Signal** (1 hour)
   - Footer: "Supporting artisans since [Year]"

---

## SUCCESS METRICS BY PHASE

### Phase 1 (MVP)
- Homepage bounce rate < 60%
- Session duration > 3 min
- Tour inquiries: 3-5

### Phase 2 (Enhanced)
- Organic traffic +30%
- Conversion rate > 3%
- Time on site > 5 min

### Phase 3 (Advanced)
- Conversion rate > 5%
- Avg booking value > $3,000
- Repeat customers > 15%
- Organic traffic +100%

---

## RECOMMENDED TOOLS

### Phase 1-2
- Canva Pro ($12/month)
- Grammarly Premium ($12/month)
- Google Search Console (Free)
- Google Analytics 4 (Free)

### Phase 2-3
- Ahrefs/SEMrush ($100-200/month)
- Mailchimp (Free-$50/month)
- Calendly (Free-$10/month)
- Typeform (Free-$35/month)

### Phase 3
- YouTube (Free)
- HubSpot Free CRM (Free)
- Google Optimize (Free)
- Hotjar/Microsoft Clarity (Free)

---

## CRITICAL SUCCESS FACTORS

1. **Start with content, not features** - Messaging is 80% of pivot
2. **Artisan relationships = moat** - Competitors can't copy access
3. **Video builds trust** - Documentary-style content differentiates
4. **Test before heavy development** - MVP validates demand first
5. **SEO is long game** - Start content now, results in 3-6 months

---

## LAUNCH SEQUENCE

**Week 1:** Homepage + About transformation  
**Week 2-3:** Tours page + 3 blog articles  
**Week 4:** Soft launch, gather feedback  
**Week 5-8:** Iterate, continue content  
**Week 9-12:** Artisan pages, craft calendar  
**Month 4-6:** Video, community, advanced features

---

**Next Steps:**
1. Review roadmap with stakeholders
2. Identify Phase 1 quick wins to start
3. Commission artisan photography
4. Begin homepage transformation

---

**Document End**
