--
-- PostgreSQL database dump
--

\restrict U2JL9Q1rRFypT830Jl1BW6NKdJBeIrpcvIpwR7tVhHLrffQCcXcpTZ95maAX2cw

-- Dumped from database version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 16.11 (Ubuntu 16.11-0ubuntu0.24.04.1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: ActivityType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ActivityType" AS ENUM (
    'CALL',
    'TELEGRAM',
    'WHATSAPP',
    'EMAIL',
    'MEETING',
    'VIEWING',
    'NOTE',
    'STATUS_CHANGE'
);


ALTER TYPE public."ActivityType" OWNER TO postgres;

--
-- Name: AgencyRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AgencyRole" AS ENUM (
    'OWNER',
    'ADMIN',
    'SENIOR_AGENT',
    'AGENT',
    'COORDINATOR'
);


ALTER TYPE public."AgencyRole" OWNER TO postgres;

--
-- Name: AgencyTier; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AgencyTier" AS ENUM (
    'FREE_TRIAL',
    'SOLO',
    'SMALL',
    'GROWING',
    'ENTERPRISE'
);


ALTER TYPE public."AgencyTier" OWNER TO postgres;

--
-- Name: AgentType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AgentType" AS ENUM (
    'GENERAL',
    'RESIDENTIAL',
    'COMMERCIAL',
    'RENTAL',
    'LUXURY'
);


ALTER TYPE public."AgentType" OWNER TO postgres;

--
-- Name: AmenityType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AmenityType" AS ENUM (
    'METRO',
    'BUS_STOP',
    'SCHOOL',
    'KINDERGARTEN',
    'HOSPITAL',
    'PHARMACY',
    'SUPERMARKET',
    'SHOPPING_MALL',
    'RESTAURANT',
    'CAFE',
    'PARK',
    'GYM',
    'BANK'
);


ALTER TYPE public."AmenityType" OWNER TO postgres;

--
-- Name: BuildingClass; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BuildingClass" AS ENUM (
    'ECONOMY',
    'COMFORT',
    'BUSINESS',
    'ELITE'
);


ALTER TYPE public."BuildingClass" OWNER TO postgres;

--
-- Name: BuildingType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."BuildingType" AS ENUM (
    'BRICK',
    'PANEL',
    'MONOLITHIC',
    'WOOD',
    'BLOCK'
);


ALTER TYPE public."BuildingType" OWNER TO postgres;

--
-- Name: CommissionStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CommissionStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'PAID',
    'DISPUTED'
);


ALTER TYPE public."CommissionStatus" OWNER TO postgres;

--
-- Name: ConversionType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ConversionType" AS ENUM (
    'VIEWING',
    'BOOKING',
    'PURCHASE',
    'LEASE'
);


ALTER TYPE public."ConversionType" OWNER TO postgres;

--
-- Name: Currency; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Currency" AS ENUM (
    'YE',
    'UZS'
);


ALTER TYPE public."Currency" OWNER TO postgres;

--
-- Name: DealStage; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DealStage" AS ENUM (
    'QUALIFIED',
    'VIEWING_SCHEDULED',
    'VIEWING_COMPLETED',
    'OFFER_MADE',
    'NEGOTIATION',
    'AGREEMENT_REACHED',
    'NOTARY_SCHEDULED',
    'DOCUMENTS_PENDING',
    'REGISTRATION_PENDING',
    'CLOSED_WON',
    'CLOSED_LOST'
);


ALTER TYPE public."DealStage" OWNER TO postgres;

--
-- Name: DealStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DealStatus" AS ENUM (
    'ACTIVE',
    'ON_HOLD',
    'WON',
    'LOST'
);


ALTER TYPE public."DealStatus" OWNER TO postgres;

--
-- Name: DealType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."DealType" AS ENUM (
    'BUYER',
    'SELLER',
    'BOTH'
);


ALTER TYPE public."DealType" OWNER TO postgres;

--
-- Name: LeadPriority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."LeadPriority" AS ENUM (
    'URGENT',
    'HIGH',
    'MEDIUM',
    'LOW'
);


ALTER TYPE public."LeadPriority" OWNER TO postgres;

--
-- Name: LeadSource; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."LeadSource" AS ENUM (
    'WEBSITE',
    'PHONE_CALL',
    'SOCIAL_MEDIA',
    'REFERRAL',
    'AGENT',
    'WALK_IN',
    'OTHER'
);


ALTER TYPE public."LeadSource" OWNER TO postgres;

--
-- Name: LeadStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."LeadStatus" AS ENUM (
    'NEW',
    'CONTACTED',
    'QUALIFIED',
    'NEGOTIATING',
    'CONVERTED',
    'LOST'
);


ALTER TYPE public."LeadStatus" OWNER TO postgres;

--
-- Name: ListingType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ListingType" AS ENUM (
    'SALE',
    'RENT',
    'DAILY_RENT'
);


ALTER TYPE public."ListingType" OWNER TO postgres;

--
-- Name: MarketType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."MarketType" AS ENUM (
    'NEW_BUILDING',
    'SECONDARY'
);


ALTER TYPE public."MarketType" OWNER TO postgres;

--
-- Name: OtpPurpose; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OtpPurpose" AS ENUM (
    'LOGIN',
    'REGISTRATION',
    'PASSWORD_RESET'
);


ALTER TYPE public."OtpPurpose" OWNER TO postgres;

--
-- Name: ParkingType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ParkingType" AS ENUM (
    'STREET',
    'UNDERGROUND',
    'GARAGE',
    'MULTI_LEVEL'
);


ALTER TYPE public."ParkingType" OWNER TO postgres;

--
-- Name: ProjectImageType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ProjectImageType" AS ENUM (
    'EXTERIOR',
    'INTERIOR',
    'AMENITY',
    'FLOOR_PLAN',
    'MASTER_PLAN',
    'CONSTRUCTION',
    'INFRASTRUCTURE'
);


ALTER TYPE public."ProjectImageType" OWNER TO postgres;

--
-- Name: ProjectStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ProjectStatus" AS ENUM (
    'PLANNING',
    'UNDER_CONSTRUCTION',
    'COMPLETED',
    'HANDED_OVER',
    'CANCELLED'
);


ALTER TYPE public."ProjectStatus" OWNER TO postgres;

--
-- Name: PropertyStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PropertyStatus" AS ENUM (
    'ACTIVE',
    'PENDING',
    'SOLD',
    'RENTED',
    'INACTIVE'
);


ALTER TYPE public."PropertyStatus" OWNER TO postgres;

--
-- Name: PropertyType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PropertyType" AS ENUM (
    'APARTMENT',
    'HOUSE',
    'CONDO',
    'TOWNHOUSE',
    'LAND',
    'COMMERCIAL'
);


ALTER TYPE public."PropertyType" OWNER TO postgres;

--
-- Name: RenovationType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RenovationType" AS ENUM (
    'NONE',
    'COSMETIC',
    'EURO',
    'DESIGNER',
    'NEEDS_REPAIR'
);


ALTER TYPE public."RenovationType" OWNER TO postgres;

--
-- Name: TaskPriority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TaskPriority" AS ENUM (
    'URGENT',
    'HIGH',
    'MEDIUM',
    'LOW'
);


ALTER TYPE public."TaskPriority" OWNER TO postgres;

--
-- Name: TaskStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TaskStatus" AS ENUM (
    'PENDING',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);


ALTER TYPE public."TaskStatus" OWNER TO postgres;

--
-- Name: TaskType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TaskType" AS ENUM (
    'FOLLOW_UP',
    'VIEWING',
    'SEND_LISTINGS',
    'DOCUMENT',
    'MEETING',
    'OTHER'
);


ALTER TYPE public."TaskType" OWNER TO postgres;

--
-- Name: UnitStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UnitStatus" AS ENUM (
    'AVAILABLE',
    'RESERVED',
    'SOLD',
    'HANDED_OVER'
);


ALTER TYPE public."UnitStatus" OWNER TO postgres;

--
-- Name: UserRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."UserRole" AS ENUM (
    'USER',
    'AGENT',
    'ADMIN'
);


ALTER TYPE public."UserRole" OWNER TO postgres;

--
-- Name: ViewingStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ViewingStatus" AS ENUM (
    'PENDING',
    'CONFIRMED',
    'CANCELLED',
    'COMPLETED'
);


ALTER TYPE public."ViewingStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: AdminLog; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AdminLog" (
    id text NOT NULL,
    "adminId" text NOT NULL,
    action text NOT NULL,
    "targetType" text NOT NULL,
    "targetId" text NOT NULL,
    details jsonb,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."AdminLog" OWNER TO postgres;

--
-- Name: Agency; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Agency" (
    id text NOT NULL,
    name text NOT NULL,
    slug text NOT NULL,
    logo text,
    description text,
    website text,
    email text,
    phone text,
    address text,
    city text,
    "yearsOnPlatform" integer DEFAULT 0 NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Agency" OWNER TO postgres;

--
-- Name: Agent; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Agent" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "agencyId" text,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    photo text,
    bio text,
    phone text,
    email text,
    whatsapp text,
    telegram text,
    "licenseNumber" text,
    specializations text[],
    languages text[],
    "areasServed" text[],
    "yearsExperience" integer DEFAULT 0 NOT NULL,
    "totalDeals" integer DEFAULT 0 NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    "superAgent" boolean DEFAULT false NOT NULL,
    "responseTime" text,
    rating double precision DEFAULT 0 NOT NULL,
    "reviewCount" integer DEFAULT 0 NOT NULL,
    "showPhone" boolean DEFAULT true NOT NULL,
    "showEmail" boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Agent" OWNER TO postgres;

--
-- Name: AgentReview; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."AgentReview" (
    id text NOT NULL,
    "agentId" text NOT NULL,
    "userId" text NOT NULL,
    rating integer NOT NULL,
    comment text,
    "dealType" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."AgentReview" OWNER TO postgres;

--
-- Name: Conversation; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Conversation" (
    id text NOT NULL,
    "propertyId" text NOT NULL,
    "participant1Id" text NOT NULL,
    "participant2Id" text NOT NULL,
    "lastMessageAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Conversation" OWNER TO postgres;

--
-- Name: Favorite; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Favorite" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "propertyId" text NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Favorite" OWNER TO postgres;

--
-- Name: Message; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Message" (
    id text NOT NULL,
    "conversationId" text NOT NULL,
    "senderId" text NOT NULL,
    content text NOT NULL,
    read boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."Message" OWNER TO postgres;

--
-- Name: Property; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Property" (
    id text NOT NULL,
    "userId" text NOT NULL,
    title text NOT NULL,
    description text NOT NULL,
    price double precision NOT NULL,
    "propertyType" public."PropertyType" NOT NULL,
    "listingType" public."ListingType" NOT NULL,
    status public."PropertyStatus" DEFAULT 'ACTIVE'::public."PropertyStatus" NOT NULL,
    address text NOT NULL,
    city text NOT NULL,
    state text,
    country text DEFAULT 'Uzbekistan'::text NOT NULL,
    "zipCode" text,
    latitude double precision,
    longitude double precision,
    district text,
    "nearestMetro" text,
    "metroDistance" integer,
    bedrooms integer,
    bathrooms double precision,
    area double precision,
    "livingArea" double precision,
    "kitchenArea" double precision,
    rooms integer,
    "yearBuilt" integer,
    floor integer,
    "totalFloors" integer,
    "ceilingHeight" double precision,
    parking integer,
    "parkingType" public."ParkingType",
    balcony integer,
    loggia integer,
    "buildingType" public."BuildingType",
    "buildingClass" public."BuildingClass",
    "buildingName" text,
    "elevatorPassenger" integer,
    "elevatorCargo" integer,
    "hasGarbageChute" boolean DEFAULT false NOT NULL,
    "hasConcierge" boolean DEFAULT false NOT NULL,
    "hasGatedArea" boolean DEFAULT false NOT NULL,
    renovation public."RenovationType",
    "windowView" text,
    "bathroomType" text,
    furnished text,
    views integer DEFAULT 0 NOT NULL,
    featured boolean DEFAULT false NOT NULL,
    verified boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Property" OWNER TO postgres;

--
-- Name: PropertyAmenity; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PropertyAmenity" (
    id text NOT NULL,
    "propertyId" text NOT NULL,
    amenity text NOT NULL
);


ALTER TABLE public."PropertyAmenity" OWNER TO postgres;

--
-- Name: PropertyImage; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."PropertyImage" (
    id text NOT NULL,
    "propertyId" text NOT NULL,
    url text NOT NULL,
    "order" integer DEFAULT 0 NOT NULL,
    "isPrimary" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."PropertyImage" OWNER TO postgres;

--
-- Name: RecentlyViewed; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."RecentlyViewed" (
    id text NOT NULL,
    "userId" text NOT NULL,
    "propertyId" text NOT NULL,
    "viewedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public."RecentlyViewed" OWNER TO postgres;

--
-- Name: Review; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Review" (
    id text NOT NULL,
    "propertyId" text NOT NULL,
    "userId" text NOT NULL,
    rating integer NOT NULL,
    comment text NOT NULL,
    approved boolean DEFAULT true NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Review" OWNER TO postgres;

--
-- Name: SavedSearch; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."SavedSearch" (
    id text NOT NULL,
    "userId" text NOT NULL,
    name text NOT NULL,
    filters jsonb NOT NULL,
    "notificationsEnabled" boolean DEFAULT false NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."SavedSearch" OWNER TO postgres;

--
-- Name: User; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text NOT NULL,
    "passwordHash" text NOT NULL,
    "firstName" text NOT NULL,
    "lastName" text NOT NULL,
    role public."UserRole" DEFAULT 'USER'::public."UserRole" NOT NULL,
    banned boolean DEFAULT false NOT NULL,
    "banReason" text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."User" OWNER TO postgres;

--
-- Name: Viewing; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."Viewing" (
    id text NOT NULL,
    "propertyId" text NOT NULL,
    "requesterId" text NOT NULL,
    "ownerId" text NOT NULL,
    date timestamp(3) without time zone NOT NULL,
    "time" text NOT NULL,
    status public."ViewingStatus" DEFAULT 'PENDING'::public."ViewingStatus" NOT NULL,
    message text,
    notes text,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone NOT NULL
);


ALTER TABLE public."Viewing" OWNER TO postgres;

--
-- Name: _prisma_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public._prisma_migrations (
    id character varying(36) NOT NULL,
    checksum character varying(64) NOT NULL,
    finished_at timestamp with time zone,
    migration_name character varying(255) NOT NULL,
    logs text,
    rolled_back_at timestamp with time zone,
    started_at timestamp with time zone DEFAULT now() NOT NULL,
    applied_steps_count integer DEFAULT 0 NOT NULL
);


ALTER TABLE public._prisma_migrations OWNER TO postgres;

--
-- Data for Name: AdminLog; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AdminLog" (id, "adminId", action, "targetType", "targetId", details, "createdAt") FROM stdin;
\.


--
-- Data for Name: Agency; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Agency" (id, name, slug, logo, description, website, email, phone, address, city, "yearsOnPlatform", verified, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Agent; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Agent" (id, "userId", "agencyId", "firstName", "lastName", photo, bio, phone, email, whatsapp, telegram, "licenseNumber", specializations, languages, "areasServed", "yearsExperience", "totalDeals", verified, "superAgent", "responseTime", rating, "reviewCount", "showPhone", "showEmail", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: AgentReview; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."AgentReview" (id, "agentId", "userId", rating, comment, "dealType", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Conversation; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Conversation" (id, "propertyId", "participant1Id", "participant2Id", "lastMessageAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: Favorite; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Favorite" (id, "userId", "propertyId", "createdAt") FROM stdin;
\.


--
-- Data for Name: Message; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Message" (id, "conversationId", "senderId", content, read, "createdAt") FROM stdin;
\.


--
-- Data for Name: Property; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Property" (id, "userId", title, description, price, "propertyType", "listingType", status, address, city, state, country, "zipCode", latitude, longitude, district, "nearestMetro", "metroDistance", bedrooms, bathrooms, area, "livingArea", "kitchenArea", rooms, "yearBuilt", floor, "totalFloors", "ceilingHeight", parking, "parkingType", balcony, loggia, "buildingType", "buildingClass", "buildingName", "elevatorPassenger", "elevatorCargo", "hasGarbageChute", "hasConcierge", "hasGatedArea", renovation, "windowView", "bathroomType", furnished, views, featured, verified, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: PropertyAmenity; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PropertyAmenity" (id, "propertyId", amenity) FROM stdin;
\.


--
-- Data for Name: PropertyImage; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."PropertyImage" (id, "propertyId", url, "order", "isPrimary", "createdAt") FROM stdin;
\.


--
-- Data for Name: RecentlyViewed; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."RecentlyViewed" (id, "userId", "propertyId", "viewedAt") FROM stdin;
\.


--
-- Data for Name: Review; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Review" (id, "propertyId", "userId", rating, comment, approved, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: SavedSearch; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."SavedSearch" (id, "userId", name, filters, "notificationsEnabled", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."User" (id, email, "passwordHash", "firstName", "lastName", role, banned, "banReason", "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: Viewing; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Viewing" (id, "propertyId", "requesterId", "ownerId", date, "time", status, message, notes, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
173c174d-e12b-4795-8331-fcae85b4a587	39b2b66fe0e842d6474e84bb49c29b7883b3cbdb9bea5a69079cbb4f7cf58663	2025-12-15 23:45:59.464651+05	20251206110545_init	\N	\N	2025-12-15 23:45:59.22674+05	1
\.


--
-- Name: AdminLog AdminLog_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AdminLog"
    ADD CONSTRAINT "AdminLog_pkey" PRIMARY KEY (id);


--
-- Name: Agency Agency_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Agency"
    ADD CONSTRAINT "Agency_pkey" PRIMARY KEY (id);


--
-- Name: AgentReview AgentReview_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AgentReview"
    ADD CONSTRAINT "AgentReview_pkey" PRIMARY KEY (id);


--
-- Name: Agent Agent_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Agent"
    ADD CONSTRAINT "Agent_pkey" PRIMARY KEY (id);


--
-- Name: Conversation Conversation_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_pkey" PRIMARY KEY (id);


--
-- Name: Favorite Favorite_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Favorite"
    ADD CONSTRAINT "Favorite_pkey" PRIMARY KEY (id);


--
-- Name: Message Message_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_pkey" PRIMARY KEY (id);


--
-- Name: PropertyAmenity PropertyAmenity_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PropertyAmenity"
    ADD CONSTRAINT "PropertyAmenity_pkey" PRIMARY KEY (id);


--
-- Name: PropertyImage PropertyImage_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PropertyImage"
    ADD CONSTRAINT "PropertyImage_pkey" PRIMARY KEY (id);


--
-- Name: Property Property_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Property"
    ADD CONSTRAINT "Property_pkey" PRIMARY KEY (id);


--
-- Name: RecentlyViewed RecentlyViewed_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RecentlyViewed"
    ADD CONSTRAINT "RecentlyViewed_pkey" PRIMARY KEY (id);


--
-- Name: Review Review_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_pkey" PRIMARY KEY (id);


--
-- Name: SavedSearch SavedSearch_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SavedSearch"
    ADD CONSTRAINT "SavedSearch_pkey" PRIMARY KEY (id);


--
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- Name: Viewing Viewing_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Viewing"
    ADD CONSTRAINT "Viewing_pkey" PRIMARY KEY (id);


--
-- Name: _prisma_migrations _prisma_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public._prisma_migrations
    ADD CONSTRAINT _prisma_migrations_pkey PRIMARY KEY (id);


--
-- Name: AdminLog_action_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AdminLog_action_idx" ON public."AdminLog" USING btree (action);


--
-- Name: AdminLog_adminId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AdminLog_adminId_idx" ON public."AdminLog" USING btree ("adminId");


--
-- Name: AdminLog_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AdminLog_createdAt_idx" ON public."AdminLog" USING btree ("createdAt");


--
-- Name: Agency_city_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Agency_city_idx" ON public."Agency" USING btree (city);


--
-- Name: Agency_slug_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Agency_slug_idx" ON public."Agency" USING btree (slug);


--
-- Name: Agency_slug_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Agency_slug_key" ON public."Agency" USING btree (slug);


--
-- Name: AgentReview_agentId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AgentReview_agentId_idx" ON public."AgentReview" USING btree ("agentId");


--
-- Name: AgentReview_agentId_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "AgentReview_agentId_userId_key" ON public."AgentReview" USING btree ("agentId", "userId");


--
-- Name: AgentReview_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "AgentReview_userId_idx" ON public."AgentReview" USING btree ("userId");


--
-- Name: Agent_agencyId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Agent_agencyId_idx" ON public."Agent" USING btree ("agencyId");


--
-- Name: Agent_superAgent_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Agent_superAgent_idx" ON public."Agent" USING btree ("superAgent");


--
-- Name: Agent_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Agent_userId_idx" ON public."Agent" USING btree ("userId");


--
-- Name: Agent_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Agent_userId_key" ON public."Agent" USING btree ("userId");


--
-- Name: Agent_verified_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Agent_verified_idx" ON public."Agent" USING btree (verified);


--
-- Name: Conversation_participant1Id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Conversation_participant1Id_idx" ON public."Conversation" USING btree ("participant1Id");


--
-- Name: Conversation_participant2Id_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Conversation_participant2Id_idx" ON public."Conversation" USING btree ("participant2Id");


--
-- Name: Conversation_propertyId_participant1Id_participant2Id_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Conversation_propertyId_participant1Id_participant2Id_key" ON public."Conversation" USING btree ("propertyId", "participant1Id", "participant2Id");


--
-- Name: Favorite_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Favorite_userId_idx" ON public."Favorite" USING btree ("userId");


--
-- Name: Favorite_userId_propertyId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Favorite_userId_propertyId_key" ON public."Favorite" USING btree ("userId", "propertyId");


--
-- Name: Message_conversationId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Message_conversationId_idx" ON public."Message" USING btree ("conversationId");


--
-- Name: Message_createdAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Message_createdAt_idx" ON public."Message" USING btree ("createdAt");


--
-- Name: Message_senderId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Message_senderId_idx" ON public."Message" USING btree ("senderId");


--
-- Name: PropertyAmenity_propertyId_amenity_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "PropertyAmenity_propertyId_amenity_key" ON public."PropertyAmenity" USING btree ("propertyId", amenity);


--
-- Name: PropertyAmenity_propertyId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PropertyAmenity_propertyId_idx" ON public."PropertyAmenity" USING btree ("propertyId");


--
-- Name: PropertyImage_propertyId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "PropertyImage_propertyId_idx" ON public."PropertyImage" USING btree ("propertyId");


--
-- Name: Property_buildingClass_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Property_buildingClass_idx" ON public."Property" USING btree ("buildingClass");


--
-- Name: Property_city_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Property_city_idx" ON public."Property" USING btree (city);


--
-- Name: Property_listingType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Property_listingType_idx" ON public."Property" USING btree ("listingType");


--
-- Name: Property_price_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Property_price_idx" ON public."Property" USING btree (price);


--
-- Name: Property_propertyType_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Property_propertyType_idx" ON public."Property" USING btree ("propertyType");


--
-- Name: Property_status_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Property_status_idx" ON public."Property" USING btree (status);


--
-- Name: Property_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Property_userId_idx" ON public."Property" USING btree ("userId");


--
-- Name: RecentlyViewed_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RecentlyViewed_userId_idx" ON public."RecentlyViewed" USING btree ("userId");


--
-- Name: RecentlyViewed_userId_propertyId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "RecentlyViewed_userId_propertyId_key" ON public."RecentlyViewed" USING btree ("userId", "propertyId");


--
-- Name: RecentlyViewed_viewedAt_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "RecentlyViewed_viewedAt_idx" ON public."RecentlyViewed" USING btree ("viewedAt");


--
-- Name: Review_propertyId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Review_propertyId_idx" ON public."Review" USING btree ("propertyId");


--
-- Name: Review_propertyId_userId_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "Review_propertyId_userId_key" ON public."Review" USING btree ("propertyId", "userId");


--
-- Name: Review_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Review_userId_idx" ON public."Review" USING btree ("userId");


--
-- Name: SavedSearch_userId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "SavedSearch_userId_idx" ON public."SavedSearch" USING btree ("userId");


--
-- Name: User_email_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_email_idx" ON public."User" USING btree (email);


--
-- Name: User_email_key; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX "User_email_key" ON public."User" USING btree (email);


--
-- Name: User_role_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "User_role_idx" ON public."User" USING btree (role);


--
-- Name: Viewing_date_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Viewing_date_idx" ON public."Viewing" USING btree (date);


--
-- Name: Viewing_ownerId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Viewing_ownerId_idx" ON public."Viewing" USING btree ("ownerId");


--
-- Name: Viewing_propertyId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Viewing_propertyId_idx" ON public."Viewing" USING btree ("propertyId");


--
-- Name: Viewing_requesterId_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "Viewing_requesterId_idx" ON public."Viewing" USING btree ("requesterId");


--
-- Name: AdminLog AdminLog_adminId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AdminLog"
    ADD CONSTRAINT "AdminLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: AgentReview AgentReview_agentId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."AgentReview"
    ADD CONSTRAINT "AgentReview_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES public."Agent"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Agent Agent_agencyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Agent"
    ADD CONSTRAINT "Agent_agencyId_fkey" FOREIGN KEY ("agencyId") REFERENCES public."Agency"(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: Agent Agent_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Agent"
    ADD CONSTRAINT "Agent_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Conversation Conversation_propertyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Conversation"
    ADD CONSTRAINT "Conversation_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES public."Property"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Favorite Favorite_propertyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Favorite"
    ADD CONSTRAINT "Favorite_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES public."Property"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Favorite Favorite_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Favorite"
    ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Message Message_conversationId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Message"
    ADD CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES public."Conversation"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PropertyAmenity PropertyAmenity_propertyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PropertyAmenity"
    ADD CONSTRAINT "PropertyAmenity_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES public."Property"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: PropertyImage PropertyImage_propertyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."PropertyImage"
    ADD CONSTRAINT "PropertyImage_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES public."Property"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Property Property_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Property"
    ADD CONSTRAINT "Property_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: RecentlyViewed RecentlyViewed_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."RecentlyViewed"
    ADD CONSTRAINT "RecentlyViewed_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Review Review_propertyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES public."Property"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Review Review_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Review"
    ADD CONSTRAINT "Review_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SavedSearch SavedSearch_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."SavedSearch"
    ADD CONSTRAINT "SavedSearch_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Viewing Viewing_ownerId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Viewing"
    ADD CONSTRAINT "Viewing_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Viewing Viewing_propertyId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Viewing"
    ADD CONSTRAINT "Viewing_propertyId_fkey" FOREIGN KEY ("propertyId") REFERENCES public."Property"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: Viewing Viewing_requesterId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."Viewing"
    ADD CONSTRAINT "Viewing_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES public."User"(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict U2JL9Q1rRFypT830Jl1BW6NKdJBeIrpcvIpwR7tVhHLrffQCcXcpTZ95maAX2cw

