--
-- PostgreSQL database dump
--

\restrict Iu0tQw98iLXrYU7sa5ZthM4ZxH44IRJDYt56MaVJgKYlraodJGFuV2JQtIHisPF

-- Dumped from database version 17.7 (Debian 17.7-3.pgdg13+1)
-- Dumped by pg_dump version 17.7

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--

-- *not* creating schema, since initdb creates it


--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON SCHEMA public IS '';


--
-- Name: InvitationStatus; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."InvitationStatus" AS ENUM (
    'PENDING',
    'ACCEPTED',
    'EXPIRED',
    'REVOKED'
);


--
-- Name: Role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."Role" AS ENUM (
    'SUPERADMIN',
    'AREA_MANAGER',
    'CITY_COORDINATOR',
    'ACTIVIST_COORDINATOR'
);


--
-- Name: TokenType; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public."TokenType" AS ENUM (
    'EMAIL_CONFIRMATION',
    'PASSWORD_RESET'
);


--
-- Name: attendance_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.attendance_status AS ENUM (
    'PRESENT',
    'NOT_PRESENT'
);


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activist_coordinator_neighborhoods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activist_coordinator_neighborhoods (
    id text NOT NULL,
    city_id text NOT NULL,
    activist_coordinator_id text NOT NULL,
    neighborhood_id text NOT NULL,
    legacy_activist_coordinator_user_id text NOT NULL,
    assigned_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    assigned_by text,
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: activist_coordinators; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activist_coordinators (
    id text NOT NULL,
    city_id text NOT NULL,
    user_id text NOT NULL,
    title text,
    is_active boolean DEFAULT true NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: activists; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activists (
    id text NOT NULL,
    full_name text NOT NULL,
    phone text,
    email text,
    "position" text,
    avatar_url text,
    start_date timestamp(3) without time zone,
    end_date timestamp(3) without time zone,
    is_active boolean DEFAULT true NOT NULL,
    notes text,
    tags text[] DEFAULT ARRAY[]::text[],
    metadata jsonb,
    city_id text NOT NULL,
    neighborhood_id text NOT NULL,
    activist_coordinator_id text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: area_managers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.area_managers (
    id text NOT NULL,
    user_id text NOT NULL,
    region_code text NOT NULL,
    region_name text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: attendance_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_records (
    id text NOT NULL,
    activist_id text NOT NULL,
    neighborhood_id text NOT NULL,
    city_id text NOT NULL,
    date date NOT NULL,
    checked_in_at timestamp with time zone,
    status public.attendance_status DEFAULT 'PRESENT'::public.attendance_status NOT NULL,
    checked_in_by_id text NOT NULL,
    notes text,
    last_edited_by_id text,
    last_edited_at timestamp with time zone,
    edit_reason text,
    checked_in_latitude double precision,
    checked_in_longitude double precision,
    checked_in_accuracy double precision,
    checked_in_gps_time timestamp with time zone,
    is_within_geofence boolean DEFAULT true NOT NULL,
    distance_from_site double precision,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id text NOT NULL,
    action text NOT NULL,
    entity text NOT NULL,
    entity_id text NOT NULL,
    before jsonb,
    after jsonb,
    user_id text,
    user_email text,
    user_role text,
    city_id text,
    ip_address text,
    user_agent text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: cities; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.cities (
    id text NOT NULL,
    name text NOT NULL,
    code text NOT NULL,
    description text,
    logo_url text,
    area_manager_id text,
    email text,
    phone text,
    address text,
    is_active boolean DEFAULT true NOT NULL,
    settings jsonb DEFAULT '{}'::jsonb NOT NULL,
    metadata jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: city_coordinators; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.city_coordinators (
    id text NOT NULL,
    city_id text NOT NULL,
    user_id text NOT NULL,
    title text,
    is_active boolean DEFAULT true NOT NULL,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: invitations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invitations (
    id text NOT NULL,
    email text NOT NULL,
    role public."Role" NOT NULL,
    status public."InvitationStatus" DEFAULT 'PENDING'::public."InvitationStatus" NOT NULL,
    token text NOT NULL,
    message text,
    expires_at timestamp(3) without time zone NOT NULL,
    city_id text,
    target_neighborhood_id text,
    created_by_id text NOT NULL,
    accepted_at timestamp(3) without time zone,
    metadata jsonb DEFAULT '{}'::jsonb,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: neighborhoods; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.neighborhoods (
    id text NOT NULL,
    name text NOT NULL,
    address text,
    city text,
    country text DEFAULT 'Israel'::text,
    latitude double precision,
    longitude double precision,
    phone text,
    email text,
    is_active boolean DEFAULT true NOT NULL,
    metadata jsonb,
    city_id text NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL
);


--
-- Name: push_subscriptions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.push_subscriptions (
    id bigint NOT NULL,
    user_id text NOT NULL,
    endpoint text NOT NULL,
    p256dh text NOT NULL,
    auth text NOT NULL,
    user_agent text,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    last_used_at timestamp(3) without time zone
);


--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.push_subscriptions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.push_subscriptions_id_seq OWNED BY public.push_subscriptions.id;


--
-- Name: task_assignments; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.task_assignments (
    id bigint NOT NULL,
    task_id bigint NOT NULL,
    target_user_id text NOT NULL,
    status text DEFAULT 'unread'::text NOT NULL,
    read_at timestamp(3) without time zone,
    acknowledged_at timestamp(3) without time zone,
    archived_at timestamp(3) without time zone,
    deleted_for_recipient_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: task_assignments_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.task_assignments_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: task_assignments_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.task_assignments_id_seq OWNED BY public.task_assignments.id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id bigint NOT NULL,
    type text DEFAULT 'Task'::text NOT NULL,
    body text NOT NULL,
    sender_user_id text NOT NULL,
    execution_date date NOT NULL,
    recipients_count integer NOT NULL,
    deleted_by_sender_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tasks_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: user_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_tokens (
    id text NOT NULL,
    user_id text NOT NULL,
    type public."TokenType" NOT NULL,
    token text NOT NULL,
    expires_at timestamp(3) without time zone NOT NULL,
    used_at timestamp(3) without time zone,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id text NOT NULL,
    email text NOT NULL,
    full_name text NOT NULL,
    phone text,
    avatar_url text,
    password_hash text,
    role public."Role" DEFAULT 'ACTIVIST_COORDINATOR'::public."Role" NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    is_super_admin boolean DEFAULT false NOT NULL,
    created_at timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp(3) without time zone NOT NULL,
    last_login_at timestamp(3) without time zone
);


--
-- Name: push_subscriptions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions ALTER COLUMN id SET DEFAULT nextval('public.push_subscriptions_id_seq'::regclass);


--
-- Name: task_assignments id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_assignments ALTER COLUMN id SET DEFAULT nextval('public.task_assignments_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Data for Name: activist_coordinator_neighborhoods; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activist_coordinator_neighborhoods (id, city_id, activist_coordinator_id, neighborhood_id, legacy_activist_coordinator_user_id, assigned_at, assigned_by, metadata, created_at, updated_at) FROM stdin;
f49ea923-344e-4d2f-9593-b7c905f54220	2eacc76c-46f9-4b63-a39e-a598d9503eca	0f94aa4c-658d-47cf-b02f-0440854df3df	tlv-florentin	f5da5ec1-be67-4a72-8c8c-412a9fc3da09	2025-12-14 23:21:38.806	e4b54c98-38d5-4f14-a477-48497043c993	\N	2025-12-14 23:21:38.806	2025-12-14 23:21:38.806
3246e7e6-78b6-4389-8e1b-ed9a6706944a	2eacc76c-46f9-4b63-a39e-a598d9503eca	0f94aa4c-658d-47cf-b02f-0440854df3df	tlv-neve-tzedek	f5da5ec1-be67-4a72-8c8c-412a9fc3da09	2025-12-14 23:21:38.828	e4b54c98-38d5-4f14-a477-48497043c993	\N	2025-12-14 23:21:38.828	2025-12-14 23:21:38.828
e24c9e7c-81cf-4772-97e9-352d0e2bd8b8	2eacc76c-46f9-4b63-a39e-a598d9503eca	a76b869d-b5d8-43e9-9bc1-5b4c5396b30d	tlv-old-jaffa	c7009284-e6de-47d9-a873-0729cf025f65	2025-12-14 23:21:39.003	e4b54c98-38d5-4f14-a477-48497043c993	\N	2025-12-14 23:21:39.003	2025-12-14 23:21:39.003
3cf3ff90-42d0-402e-8681-baf0270425fc	f400dbf5-47d7-4ef0-9914-2060811bae4a	d05d8ab7-4974-43e2-a653-a74a694a49e0	rg-center	5cca662d-ae54-4be8-bea9-28f1cde3e344	2025-12-14 23:21:39.64	e4b54c98-38d5-4f14-a477-48497043c993	\N	2025-12-14 23:21:39.64	2025-12-14 23:21:39.64
02b90b99-5cf3-4c37-a3b9-747664bda765	aadc7bed-f4de-4493-b16a-e256204eb6c9	ca866fb5-2221-4512-a24d-42f1c6c9c152	6594f36d-bf0d-4d86-acb7-f6c13d40af3d	e833fc36-0d25-414e-84c1-6d3785f3511c	2025-12-15 19:04:12.291	a3a7a69e-dd76-4475-aa41-a2da784ddfd4	\N	2025-12-15 19:04:12.291	2025-12-15 19:04:12.291
\.


--
-- Data for Name: activist_coordinators; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activist_coordinators (id, city_id, user_id, title, is_active, metadata, created_at, updated_at) FROM stdin;
0f94aa4c-658d-47cf-b02f-0440854df3df	2eacc76c-46f9-4b63-a39e-a598d9503eca	f5da5ec1-be67-4a72-8c8c-412a9fc3da09	רכזת שכונות מרכז	t	{}	2025-12-14 23:21:38.778	2025-12-14 23:21:38.778
a76b869d-b5d8-43e9-9bc1-5b4c5396b30d	2eacc76c-46f9-4b63-a39e-a598d9503eca	c7009284-e6de-47d9-a873-0729cf025f65	רכזת יפו	t	{}	2025-12-14 23:21:38.974	2025-12-14 23:21:38.974
d05d8ab7-4974-43e2-a653-a74a694a49e0	f400dbf5-47d7-4ef0-9914-2060811bae4a	5cca662d-ae54-4be8-bea9-28f1cde3e344	רכז מרכז העיר	t	{}	2025-12-14 23:21:39.622	2025-12-14 23:21:39.622
ca866fb5-2221-4512-a24d-42f1c6c9c152	aadc7bed-f4de-4493-b16a-e256204eb6c9	e833fc36-0d25-414e-84c1-6d3785f3511c	Activist Coordinator	t	{}	2025-12-15 19:03:57.261	2025-12-15 19:03:57.261
\.


--
-- Data for Name: activists; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activists (id, full_name, phone, email, "position", avatar_url, start_date, end_date, is_active, notes, tags, metadata, city_id, neighborhood_id, activist_coordinator_id, created_at, updated_at) FROM stdin;
61478bc3-d5b4-40ce-b0c0-d6f8e918288f	יוסי מזרחי	+972-52-100-0001	972521000001@volunteer.test	דלת לדלת	\N	2024-11-01 00:00:00	\N	t	\N	{"דלת לדלת",פעיל,פלורנטין}	{"assignedTasks": "כיסוי בלוקים 1-8", "completedTasks": 12, "hoursThisMonth": 53}	2eacc76c-46f9-4b63-a39e-a598d9503eca	tlv-florentin	0f94aa4c-658d-47cf-b02f-0440854df3df	2025-12-14 23:21:39.019	2025-12-14 23:21:39.019
ba7019e9-5313-4447-b8e7-9d6a96458810	מיכל אהרון	+972-52-100-0002	972521000002@volunteer.test	טלפנות	\N	2024-11-01 00:00:00	\N	t	\N	{טלפנות,פעיל,פלורנטין}	{"assignedTasks": "רשימת קריאות - 200 איש ליום", "completedTasks": 7, "hoursThisMonth": 54}	2eacc76c-46f9-4b63-a39e-a598d9503eca	tlv-florentin	0f94aa4c-658d-47cf-b02f-0440854df3df	2025-12-14 23:21:39.04	2025-12-14 23:21:39.04
20022634-3a39-409c-bffd-a4c145d1a22a	דני לוי	+972-52-100-0003	972521000003@volunteer.test	תיאום אירועים	\N	2024-11-01 00:00:00	\N	t	\N	{"תיאום אירועים",פעיל,פלורנטין}	{"assignedTasks": "הקמת עמדות רחוב", "completedTasks": 9, "hoursThisMonth": 38}	2eacc76c-46f9-4b63-a39e-a598d9503eca	tlv-florentin	0f94aa4c-658d-47cf-b02f-0440854df3df	2025-12-14 23:21:39.049	2025-12-14 23:21:39.049
956e13ac-ee0b-488e-b83b-ca7dfebf00c0	נועה כהן	+972-52-100-0004	972521000004@volunteer.test	דלת לדלת	\N	2024-11-01 00:00:00	\N	t	\N	{"דלת לדלת",פעיל,פלורנטין}	{"assignedTasks": "כיסוי בלוקים 9-15", "completedTasks": 10, "hoursThisMonth": 33}	2eacc76c-46f9-4b63-a39e-a598d9503eca	tlv-florentin	0f94aa4c-658d-47cf-b02f-0440854df3df	2025-12-14 23:21:39.056	2025-12-14 23:21:39.056
0bae7c42-0fa8-441b-9d79-cd058b3e609c	רון שמעון	+972-52-100-0005	972521000005@volunteer.test	תיאום אירועים	\N	2024-11-01 00:00:00	\N	t	\N	{"תיאום אירועים",פעיל,פלורנטין}	{"assignedTasks": "עמדת רוטשילד", "completedTasks": 19, "hoursThisMonth": 29}	2eacc76c-46f9-4b63-a39e-a598d9503eca	tlv-florentin	0f94aa4c-658d-47cf-b02f-0440854df3df	2025-12-14 23:21:39.064	2025-12-14 23:21:39.064
fa296b1f-83f0-4ffc-9070-c66ad7dfa32b	תמר דוד	+972-52-100-0006	972521000006@volunteer.test	טלפנות	\N	2024-11-01 00:00:00	\N	t	\N	{טלפנות,פעיל,פלורנטין}	{"assignedTasks": "מוקד טלפוני ערב", "completedTasks": 5, "hoursThisMonth": 54}	2eacc76c-46f9-4b63-a39e-a598d9503eca	tlv-florentin	0f94aa4c-658d-47cf-b02f-0440854df3df	2025-12-14 23:21:39.073	2025-12-14 23:21:39.073
64d48cdf-990a-4816-83e9-f79cc7d35a05	אלי ברק	+972-52-100-0007	972521000007@volunteer.test	דלת לדלת	\N	2024-11-01 00:00:00	\N	t	\N	{"דלת לדלת",פעיל,פלורנטין}	{"assignedTasks": "בלוקים 16-22", "completedTasks": 17, "hoursThisMonth": 27}	2eacc76c-46f9-4b63-a39e-a598d9503eca	tlv-florentin	0f94aa4c-658d-47cf-b02f-0440854df3df	2025-12-14 23:21:39.083	2025-12-14 23:21:39.083
a95e10e3-c0fe-43f5-b60a-bcc0f47fdeaa	ליאת משה	+972-52-100-0008	972521000008@volunteer.test	איסוף נתונים	\N	2024-11-01 00:00:00	\N	t	\N	{"איסוף נתונים",פעיל,פלורנטין}	{"assignedTasks": "סקרי בוחרים - 50 ליום", "completedTasks": 7, "hoursThisMonth": 40}	2eacc76c-46f9-4b63-a39e-a598d9503eca	tlv-florentin	0f94aa4c-658d-47cf-b02f-0440854df3df	2025-12-14 23:21:39.092	2025-12-14 23:21:39.092
ed07597a-c7db-48c6-a4c1-9f7c9a82c39b	עמית גל	+972-52-100-0009	972521000009@volunteer.test	דלת לדלת	\N	2024-11-01 00:00:00	\N	t	\N	{"דלת לדלת",פעיל,פלורנטין}	{"assignedTasks": "בלוקים 23-30", "completedTasks": 8, "hoursThisMonth": 42}	2eacc76c-46f9-4b63-a39e-a598d9503eca	tlv-florentin	0f94aa4c-658d-47cf-b02f-0440854df3df	2025-12-14 23:21:39.101	2025-12-14 23:21:39.101
709356f9-2d35-4abd-9fd8-6638f2c55634	שירה זהבי	+972-52-100-0010	972521000010@volunteer.test	טלפנות	\N	2024-11-01 00:00:00	\N	t	\N	{טלפנות,פעיל,פלורנטין}	{"assignedTasks": "מוקד בוקר", "completedTasks": 7, "hoursThisMonth": 32}	2eacc76c-46f9-4b63-a39e-a598d9503eca	tlv-florentin	0f94aa4c-658d-47cf-b02f-0440854df3df	2025-12-14 23:21:39.111	2025-12-14 23:21:39.111
da128a66-7f39-40ba-83fe-afb63cd0df24	גיא אבני	+972-52-200-0001	972522000001@volunteer.test	דלת לדלת	\N	2024-11-01 00:00:00	\N	t	\N	{"דלת לדלת",פעיל,"נווה צדק"}	{"assignedTasks": "רחוב שבזי כולו", "completedTasks": 7, "hoursThisMonth": 39}	2eacc76c-46f9-4b63-a39e-a598d9503eca	tlv-neve-tzedek	0f94aa4c-658d-47cf-b02f-0440854df3df	2025-12-14 23:21:39.12	2025-12-14 23:21:39.12
0f6d7fa1-b90b-4f56-890e-3a5ee45f5304	ענבר כהן	+972-52-200-0002	972522000002@volunteer.test	טלפנות	\N	2024-11-01 00:00:00	\N	t	\N	{טלפנות,פעיל,"נווה צדק"}	{"assignedTasks": "150 שיחות יומי", "completedTasks": 11, "hoursThisMonth": 26}	2eacc76c-46f9-4b63-a39e-a598d9503eca	tlv-neve-tzedek	0f94aa4c-658d-47cf-b02f-0440854df3df	2025-12-14 23:21:39.132	2025-12-14 23:21:39.132
6e024e17-e9df-4492-8210-c3dcb46000da	אורי ישראל	+972-52-200-0003	972522000003@volunteer.test	תיאום אירועים	\N	2024-11-01 00:00:00	\N	t	\N	{"תיאום אירועים",פעיל,"נווה צדק"}	{"assignedTasks": "עמדת נחלת בנימין", "completedTasks": 9, "hoursThisMonth": 23}	2eacc76c-46f9-4b63-a39e-a598d9503eca	tlv-neve-tzedek	0f94aa4c-658d-47cf-b02f-0440854df3df	2025-12-14 23:21:39.139	2025-12-14 23:21:39.139
30ab77a3-d7ee-41ce-a3ab-57c30a99d3f1	מאיה לוי	+972-52-200-0004	972522000004@volunteer.test	דלת לדלת	\N	2024-11-01 00:00:00	\N	t	\N	{"דלת לדלת",פעיל,"נווה צדק"}	{"assignedTasks": "שכ׳ נווה צדק מערב", "completedTasks": 12, "hoursThisMonth": 23}	2eacc76c-46f9-4b63-a39e-a598d9503eca	tlv-neve-tzedek	0f94aa4c-658d-47cf-b02f-0440854df3df	2025-12-14 23:21:39.149	2025-12-14 23:21:39.149
ee54604e-cbdd-468a-842f-f901bad66780	אופיר גולן	+972-52-200-0005	972522000005@volunteer.test	איסוף נתונים	\N	2024-11-01 00:00:00	\N	t	\N	{"איסוף נתונים",פעיל,"נווה צדק"}	{"assignedTasks": "סקרים - 40 ליום", "completedTasks": 7, "hoursThisMonth": 23}	2eacc76c-46f9-4b63-a39e-a598d9503eca	tlv-neve-tzedek	0f94aa4c-658d-47cf-b02f-0440854df3df	2025-12-14 23:21:39.157	2025-12-14 23:21:39.157
79e4357f-0ea5-447f-8b34-47cff6dcdbfb	הדס מור	+972-52-200-0006	972522000006@volunteer.test	טלפנות	\N	2024-11-01 00:00:00	\N	t	\N	{טלפנות,פעיל,"נווה צדק"}	{"assignedTasks": "מוקד צהריים", "completedTasks": 10, "hoursThisMonth": 34}	2eacc76c-46f9-4b63-a39e-a598d9503eca	tlv-neve-tzedek	0f94aa4c-658d-47cf-b02f-0440854df3df	2025-12-14 23:21:39.168	2025-12-14 23:21:39.168
3ad71759-a3be-4359-a93e-d702562468a9	רועי שלום	+972-52-200-0007	972522000007@volunteer.test	דלת לדלת	\N	2024-11-01 00:00:00	\N	t	\N	{"דלת לדלת",פעיל,"נווה צדק"}	{"assignedTasks": "נווה צדק מזרח", "completedTasks": 9, "hoursThisMonth": 36}	2eacc76c-46f9-4b63-a39e-a598d9503eca	tlv-neve-tzedek	0f94aa4c-658d-47cf-b02f-0440854df3df	2025-12-14 23:21:39.177	2025-12-14 23:21:39.177
092eb88d-a227-4c38-bc16-bea90a8dfe2f	יערה דוד	+972-52-200-0008	972522000008@volunteer.test	תיאום אירועים	\N	2024-11-01 00:00:00	\N	t	\N	{"תיאום אירועים",פעיל,"נווה צדק"}	{"assignedTasks": "מפגש בוחרים שבועי", "completedTasks": 5, "hoursThisMonth": 45}	2eacc76c-46f9-4b63-a39e-a598d9503eca	tlv-neve-tzedek	0f94aa4c-658d-47cf-b02f-0440854df3df	2025-12-14 23:21:39.185	2025-12-14 23:21:39.185
054ba71a-0f7f-4c92-b5b5-fc1315468ff8	סמי חסן	+972-52-300-0001	972523000001@volunteer.test	דלת לדלת	\N	2024-11-01 00:00:00	\N	t	\N	{"דלת לדלת",פעיל,יפו}	{"language": "עברית/ערבית", "assignedTasks": "יפו העתיקה - צפון", "completedTasks": 10, "hoursThisMonth": 32}	2eacc76c-46f9-4b63-a39e-a598d9503eca	tlv-old-jaffa	a76b869d-b5d8-43e9-9bc1-5b4c5396b30d	2025-12-14 23:21:39.198	2025-12-14 23:21:39.198
da12af79-2fef-4eb2-82bd-d48ae6c6c065	לינה עבאס	+972-52-300-0002	972523000002@volunteer.test	טלפנות	\N	2024-11-01 00:00:00	\N	t	\N	{טלפנות,פעיל,יפו}	{"language": "עברית/ערבית", "assignedTasks": "קריאות ערבית - 100 ליום", "completedTasks": 20, "hoursThisMonth": 28}	2eacc76c-46f9-4b63-a39e-a598d9503eca	tlv-old-jaffa	a76b869d-b5d8-43e9-9bc1-5b4c5396b30d	2025-12-14 23:21:39.206	2025-12-14 23:21:39.206
78c0930c-5cf8-4733-ac16-12a2d30bc954	מוחמד עלי	+972-52-300-0003	972523000003@volunteer.test	תיאום אירועים	\N	2024-11-01 00:00:00	\N	t	\N	{"תיאום אירועים",פעיל,יפו}	{"language": "עברית/ערבית", "assignedTasks": "עמדת שוק הפשפשים", "completedTasks": 18, "hoursThisMonth": 36}	2eacc76c-46f9-4b63-a39e-a598d9503eca	tlv-old-jaffa	a76b869d-b5d8-43e9-9bc1-5b4c5396b30d	2025-12-14 23:21:39.214	2025-12-14 23:21:39.214
ea45834a-1b7f-43e6-93a7-63e944d0f4bd	ראניה סעיד	+972-52-300-0004	972523000004@volunteer.test	דלת לדלת	\N	2024-11-01 00:00:00	\N	t	\N	{"דלת לדלת",פעיל,יפו}	{"language": "עברית/ערבית", "assignedTasks": "יפו - מזרח", "completedTasks": 24, "hoursThisMonth": 45}	2eacc76c-46f9-4b63-a39e-a598d9503eca	tlv-old-jaffa	a76b869d-b5d8-43e9-9bc1-5b4c5396b30d	2025-12-14 23:21:39.25	2025-12-14 23:21:39.25
229066a2-c554-4eea-900e-435c7f663dd6	חאלד ג׳בר	+972-52-300-0005	972523000005@volunteer.test	איסוף נתונים	\N	2024-11-01 00:00:00	\N	t	\N	{"איסוף נתונים",פעיל,יפו}	{"language": "עברית/ערבית", "assignedTasks": "סקרים דו-לשוניים", "completedTasks": 24, "hoursThisMonth": 47}	2eacc76c-46f9-4b63-a39e-a598d9503eca	tlv-old-jaffa	a76b869d-b5d8-43e9-9bc1-5b4c5396b30d	2025-12-14 23:21:39.259	2025-12-14 23:21:39.259
1186fd52-a461-4c65-acc3-60f90a77dc9d	פאטמה נאסר	+972-52-300-0006	972523000006@volunteer.test	טלפנות	\N	2024-11-01 00:00:00	\N	t	\N	{טלפנות,פעיל,יפו}	{"language": "עברית/ערבית", "assignedTasks": "מוקד ערבית", "completedTasks": 13, "hoursThisMonth": 59}	2eacc76c-46f9-4b63-a39e-a598d9503eca	tlv-old-jaffa	a76b869d-b5d8-43e9-9bc1-5b4c5396b30d	2025-12-14 23:21:39.269	2025-12-14 23:21:39.269
6835a17d-ce47-46af-b456-e5cd924c5e0d	אחמד חמוד	+972-52-300-0007	972523000007@volunteer.test	דלת לדלת	\N	2024-11-01 00:00:00	\N	t	\N	{"דלת לדלת",פעיל,יפו}	{"language": "עברית/ערבית", "assignedTasks": "יפו - דרום", "completedTasks": 24, "hoursThisMonth": 26}	2eacc76c-46f9-4b63-a39e-a598d9503eca	tlv-old-jaffa	a76b869d-b5d8-43e9-9bc1-5b4c5396b30d	2025-12-14 23:21:39.278	2025-12-14 23:21:39.278
c0065682-ea2d-46d4-aa4e-f8e71966a9b9	נור כרם	+972-52-300-0008	972523000008@volunteer.test	תיאום אירועים	\N	2024-11-01 00:00:00	\N	t	\N	{"תיאום אירועים",פעיל,יפו}	{"language": "עברית/ערבית", "assignedTasks": "אירוע קהילתי שבועי", "completedTasks": 22, "hoursThisMonth": 40}	2eacc76c-46f9-4b63-a39e-a598d9503eca	tlv-old-jaffa	a76b869d-b5d8-43e9-9bc1-5b4c5396b30d	2025-12-14 23:21:39.288	2025-12-14 23:21:39.288
0bdd0f86-ffb7-4473-9d55-ba2d693eab8c	טארק עודה	+972-52-300-0009	972523000009@volunteer.test	דלת לדלת	\N	2024-11-01 00:00:00	\N	t	\N	{"דלת לדלת",פעיל,יפו}	{"language": "עברית/ערבית", "assignedTasks": "יפו - מערב", "completedTasks": 20, "hoursThisMonth": 47}	2eacc76c-46f9-4b63-a39e-a598d9503eca	tlv-old-jaffa	a76b869d-b5d8-43e9-9bc1-5b4c5396b30d	2025-12-14 23:21:39.301	2025-12-14 23:21:39.301
5e008d0a-e9c1-4a06-9711-0334789e0752	סלמה יוסף	+972-52-300-0010	972523000010@volunteer.test	טלפנות	\N	2024-11-01 00:00:00	\N	t	\N	{טלפנות,פעיל,יפו}	{"language": "עברית/ערבית", "assignedTasks": "מוקד בוקר ערבית", "completedTasks": 21, "hoursThisMonth": 59}	2eacc76c-46f9-4b63-a39e-a598d9503eca	tlv-old-jaffa	a76b869d-b5d8-43e9-9bc1-5b4c5396b30d	2025-12-14 23:21:39.31	2025-12-14 23:21:39.31
cfeba6e6-d38c-4b43-bb87-b9751ef36ceb	אורית שמש	+972-52-400-0001	972524000001@volunteer.test	דלת לדלת	\N	2024-11-15 00:00:00	\N	t	\N	{"דלת לדלת",פעיל,"רמת גן"}	{"completedTasks": 9, "hoursThisMonth": 10}	f400dbf5-47d7-4ef0-9914-2060811bae4a	rg-center	d05d8ab7-4974-43e2-a653-a74a694a49e0	2025-12-14 23:21:39.657	2025-12-14 23:21:39.657
9659f747-1e08-46ef-8753-64623d5eb099	יובל ברק	+972-52-400-0002	972524000002@volunteer.test	טלפנות	\N	2024-11-15 00:00:00	\N	t	\N	{טלפנות,פעיל,"רמת גן"}	{"completedTasks": 7, "hoursThisMonth": 37}	f400dbf5-47d7-4ef0-9914-2060811bae4a	rg-center	d05d8ab7-4974-43e2-a653-a74a694a49e0	2025-12-14 23:21:39.666	2025-12-14 23:21:39.666
079c49d2-0295-4af0-b0a5-ef0d7af794be	שרון מור	+972-52-400-0003	972524000003@volunteer.test	תיאום אירועים	\N	2024-11-15 00:00:00	\N	t	\N	{"תיאום אירועים",פעיל,"רמת גן"}	{"completedTasks": 11, "hoursThisMonth": 13}	f400dbf5-47d7-4ef0-9914-2060811bae4a	rg-center	d05d8ab7-4974-43e2-a653-a74a694a49e0	2025-12-14 23:21:39.673	2025-12-14 23:21:39.673
bf0bb953-eb86-4178-9874-555acc33589d	עידן זהבי	+972-52-400-0004	972524000004@volunteer.test	דלת לדלת	\N	2024-11-15 00:00:00	\N	t	\N	{"דלת לדלת",פעיל,"רמת גן"}	{"completedTasks": 7, "hoursThisMonth": 24}	f400dbf5-47d7-4ef0-9914-2060811bae4a	rg-center	d05d8ab7-4974-43e2-a653-a74a694a49e0	2025-12-14 23:21:39.682	2025-12-14 23:21:39.682
b000f6e4-fefd-4d70-8c04-99f0ab22696a	ליאור נחום	+972-52-400-0005	972524000005@volunteer.test	איסוף נתונים	\N	2024-11-15 00:00:00	\N	t	\N	{"איסוף נתונים",פעיל,"רמת גן"}	{"completedTasks": 4, "hoursThisMonth": 28}	f400dbf5-47d7-4ef0-9914-2060811bae4a	rg-center	d05d8ab7-4974-43e2-a653-a74a694a49e0	2025-12-14 23:21:39.705	2025-12-14 23:21:39.705
f75cf17a-bffe-457d-842f-f443c25f7138	חנה	\N	\N	\N	\N	2025-12-15 00:00:00	\N	t	\N	{}	\N	aadc7bed-f4de-4493-b16a-e256204eb6c9	6594f36d-bf0d-4d86-acb7-f6c13d40af3d	ca866fb5-2221-4512-a24d-42f1c6c9c152	2025-12-15 19:24:04.603	2025-12-15 19:24:04.603
\.


--
-- Data for Name: area_managers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.area_managers (id, user_id, region_code, region_name, is_active, metadata, created_at, updated_at) FROM stdin;
ba203c99-2b7c-45bd-baec-50ab49acbeab	fc49f30a-0c00-43f7-a8a0-6e993307434c	TA-DISTRICT	מחוז תל אביב	t	{"budget": "2,500,000 ₪", "description": "מנהלת אזורית אחראית על קמפיין הבחירות במחוז תל אביב", "targetVoters": 450000}	2025-12-14 23:21:37.276	2025-12-14 23:21:37.276
86636bca-e2b7-4ff6-a103-4195fb3991a9	308fd9e8-184e-4586-91b4-65615679c211	NORTH	מחוז הצפון	t	{"description": "מנהל אזורי אחראי על קמפיין הבחירות במחוז הצפון"}	2025-12-14 23:21:37.412	2025-12-14 23:21:37.412
6042f2c2-e247-455e-884f-91d7fe99ed7a	3578fee6-70c0-48a3-9119-510d68e2d9f3	HAIFA	מחוז חיפה	t	{"description": "מנהל אזורי אחראי על קמפיין הבחירות במחוז חיפה"}	2025-12-14 23:21:37.553	2025-12-14 23:21:37.553
a8f6c1b3-8419-44a7-a228-a4c2879c5e5d	5827a4da-f3aa-4cdc-a713-40cd3a41cb95	CENTER	מחוז המרכז	t	{"description": "מנהלת אזורית אחראית על קמפיין הבחירות במחוז המרכז"}	2025-12-14 23:21:38.122	2025-12-14 23:21:38.122
dd2001d1-44b2-4fc7-9579-4da9a96c6009	b712fffa-cb50-43a8-86ad-85081ad79b75	SOUTH	מחוז הדרום	t	{"description": "מנהלת אזורית אחראית על קמפיין הבחירות במחוז הדרום"}	2025-12-14 23:21:38.432	2025-12-14 23:21:38.432
b9193146-d1e9-425c-8111-d4fd07b56f1e	a3a7a69e-dd76-4475-aa41-a2da784ddfd4	JERUSALEM	מחוז ירושלים	t	{"description": "מנהל אזורי אחראי על קמפיין הבחירות במחוז ירושלים"}	2025-12-14 23:21:38.299	2025-12-15 18:04:21.691
\.


--
-- Data for Name: attendance_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendance_records (id, activist_id, neighborhood_id, city_id, date, checked_in_at, status, checked_in_by_id, notes, last_edited_by_id, last_edited_at, edit_reason, checked_in_latitude, checked_in_longitude, checked_in_accuracy, checked_in_gps_time, is_within_geofence, distance_from_site, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, action, entity, entity_id, before, after, user_id, user_email, user_role, city_id, ip_address, user_agent, created_at) FROM stdin;
13a50b4c-483d-4af6-8418-5e40282da1a2	CREATE_USER	User	5f4d64ec-d64f-4fe5-ace4-3b7b315f5441	\N	{"id": "5f4d64ec-d64f-4fe5-ace4-3b7b315f5441", "role": "AREA_MANAGER", "email": "ddd@gmail.com", "fullName": "סדיקה בדיקתית"}	718342c8-99c0-4dc6-a6af-502e482148a5	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-10 21:00:05.082
d0cf0c76-a7cd-4df0-acdc-29290dc373bc	CREATE_USER	User	737aafed-b5d0-461c-b1ad-220664b02b5f	\N	{"id": "737aafed-b5d0-461c-b1ad-220664b02b5f", "role": "AREA_MANAGER", "email": "dima@gmail.com", "fullName": "דימה בדיקה"}	718342c8-99c0-4dc6-a6af-502e482148a5	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-12 14:23:14.589
c8c310fc-a254-42c3-a4f9-ee3d2961694b	CREATE_AREA_MANAGER	AreaManager	f2c266f8-1a19-4c14-8df1-af55c5a7620c	\N	{"id": "f2c266f8-1a19-4c14-8df1-af55c5a7620c", "userId": "737aafed-b5d0-461c-b1ad-220664b02b5f", "isActive": true, "userEmail": "dima@gmail.com", "regionCode": "מחוז-דרום", "regionName": "מחוז דרום"}	718342c8-99c0-4dc6-a6af-502e482148a5	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-12 14:23:58.963
9c4fccd7-845f-41c3-b602-ea5b44134a30	CREATE_USER	User	86666c43-40dd-44cf-af19-191a2e65e23c	\N	{"id": "86666c43-40dd-44cf-af19-191a2e65e23c", "role": "AREA_MANAGER", "email": "dima1@gmail.com", "fullName": "דימה דימה"}	718342c8-99c0-4dc6-a6af-502e482148a5	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-13 16:18:54.751
8d41af57-6e9d-405a-9de0-0334a358f97b	CREATE_AREA_MANAGER	AreaManager	cba7c527-e44b-4354-8714-e238cd19db1c	\N	{"id": "cba7c527-e44b-4354-8714-e238cd19db1c", "userId": "86666c43-40dd-44cf-af19-191a2e65e23c", "isActive": true, "userEmail": "dima1@gmail.com", "regionCode": "השפלה", "regionName": "השפלה"}	718342c8-99c0-4dc6-a6af-502e482148a5	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-13 16:19:40.062
cb22cd5a-ce41-4cb8-8604-9a4907d7638a	CREATE_CORPORATION	Corporation	83d1a092-38ac-4111-917b-fc93b533d720	\N	{"id": "83d1a092-38ac-4111-917b-fc93b533d720", "code": "kpr-yvnh-tzpvn", "name": "כפר יונה צפון", "isActive": true}	86666c43-40dd-44cf-af19-191a2e65e23c	dima1@gmail.com	AREA_MANAGER	\N	\N	\N	2025-12-13 22:10:06.016
9f7f447b-294e-412d-a2e4-1132a2f9ebc3	CREATE_USER	User	e71a2c89-8eb7-4ef1-a5ad-3d991bb1eb2f	\N	{"id": "e71a2c89-8eb7-4ef1-a5ad-3d991bb1eb2f", "role": "CITY_COORDINATOR", "email": "dima2@gmail.com", "cityId": "83d1a092-38ac-4111-917b-fc93b533d720", "fullName": "דימה נתניה"}	86666c43-40dd-44cf-af19-191a2e65e23c	dima1@gmail.com	AREA_MANAGER	\N	\N	\N	2025-12-13 22:13:53.287
b08dc5e9-5110-4bb8-ba3b-a895550e4cdd	UPDATE_CORPORATION	Corporation	86b0a10f-3d06-4830-a65e-2c7bdaff1b46	{"code": "ofakim", "name": "אופקים", "isActive": true, "description": "עיר אופקים - אזור דרום", "areaManagerId": null}	{"code": "ofakim", "name": "אופקים", "isActive": true, "description": "עיר אופקים - אזור דרום", "areaManagerId": "cba7c527-e44b-4354-8714-e238cd19db1c"}	c2a8894c-74c5-425d-98b5-46b314db467b	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-14 20:48:54.165
eb12e687-c8fe-42c3-8ea4-ae22263e5eab	UPDATE_CORPORATION	Corporation	9c6a4ed7-0278-46c9-b6ca-8a7a23f1656b	{"code": "umm-al-fahm", "name": "אום אל-פחם", "isActive": true, "description": "עיר אום אל-פחם - אזור דרום", "areaManagerId": null}	{"code": "umm-al-fahm", "name": "אום אל-פחם", "isActive": true, "description": "עיר אום אל-פחם - אזור דרום", "areaManagerId": "cba7c527-e44b-4354-8714-e238cd19db1c"}	c2a8894c-74c5-425d-98b5-46b314db467b	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-14 20:49:11.657
fbbc2401-7d41-48f7-9a0a-bf6bc80b9108	UPDATE_CORPORATION	Corporation	9c6a4ed7-0278-46c9-b6ca-8a7a23f1656b	{"code": "umm-al-fahm", "name": "אום אל-פחם", "isActive": true, "description": "עיר אום אל-פחם - אזור דרום", "areaManagerId": "cba7c527-e44b-4354-8714-e238cd19db1c"}	{"code": "umm-al-fahm", "name": "אום אל-פחם", "isActive": true, "description": "עיר אום אל-פחם - אזור דרום", "areaManagerId": "f2c266f8-1a19-4c14-8df1-af55c5a7620c"}	c2a8894c-74c5-425d-98b5-46b314db467b	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-14 20:49:40.687
3ace3cc2-0759-40e4-88a6-a9bbcb19191b	UPDATE_CORPORATION	Corporation	9c6a4ed7-0278-46c9-b6ca-8a7a23f1656b	{"code": "umm-al-fahm", "name": "אום אל-פחם", "isActive": true, "description": "עיר אום אל-פחם - אזור דרום", "areaManagerId": "f2c266f8-1a19-4c14-8df1-af55c5a7620c"}	{"code": "umm-al-fahm", "name": "אום אל-פחם", "isActive": true, "description": "עיר אום אל-פחם - אזור דרום", "areaManagerId": "cba7c527-e44b-4354-8714-e238cd19db1c"}	c2a8894c-74c5-425d-98b5-46b314db467b	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-14 20:49:49.77
e150ab67-df5d-4972-9989-fb93f8b772c9	CREATE_USER	User	a3a7a69e-dd76-4475-aa41-a2da784ddfd4	\N	{"id": "a3a7a69e-dd76-4475-aa41-a2da784ddfd4", "role": "AREA_MANAGER", "email": "dima@gmail.com", "fullName": "דימה ירושלים"}	e4b54c98-38d5-4f14-a477-48497043c993	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-15 17:59:32.524
335a7cf8-da32-46a1-8b01-e944d4abb955	UPDATE_AREA_MANAGER	AreaManager	b9193146-d1e9-425c-8111-d4fd07b56f1e	{"userId": "bb04255c-6837-4134-909d-8f8e075a22f9", "isActive": true, "userEmail": "manager@jerusalem-district.test", "regionCode": "JERUSALEM", "regionName": "מחוז ירושלים"}	{"userId": "a3a7a69e-dd76-4475-aa41-a2da784ddfd4", "isActive": true, "userEmail": "dima@gmail.com", "regionCode": "JERUSALEM", "regionName": "מחוז ירושלים"}	e4b54c98-38d5-4f14-a477-48497043c993	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-15 18:04:21.749
12062c9b-f7ea-4a9b-ae4f-4110532121d6	CREATE_CORPORATION	Corporation	05bf816c-cbca-4f41-ba4e-f4208212e649	\N	{"id": "05bf816c-cbca-4f41-ba4e-f4208212e649", "code": "abv-gvsh", "name": "אבו גוש", "isActive": true}	a3a7a69e-dd76-4475-aa41-a2da784ddfd4	dima@gmail.com	AREA_MANAGER	\N	\N	\N	2025-12-15 18:56:12.474
a1cc2547-56cd-4635-97c4-ab6179c1032a	CREATE_CORPORATION	Corporation	aadc7bed-f4de-4493-b16a-e256204eb6c9	\N	{"id": "aadc7bed-f4de-4493-b16a-e256204eb6c9", "code": "jerusalem", "name": "ירושלים", "isActive": true}	a3a7a69e-dd76-4475-aa41-a2da784ddfd4	dima@gmail.com	AREA_MANAGER	\N	\N	\N	2025-12-15 18:56:51.11
8e443d5f-1552-4ba6-9309-534f5e69a89d	CREATE_USER	User	e9263b96-9c74-4e1b-a605-d4ba3ffa5d4e	\N	{"id": "e9263b96-9c74-4e1b-a605-d4ba3ffa5d4e", "role": "CITY_COORDINATOR", "email": "dima1@gmail.com", "cityId": "aadc7bed-f4de-4493-b16a-e256204eb6c9", "fullName": "רכז עיר בדיקה"}	a3a7a69e-dd76-4475-aa41-a2da784ddfd4	dima@gmail.com	AREA_MANAGER	\N	\N	\N	2025-12-15 18:58:35.112
85301427-c999-45d3-875b-d3021426e489	CREATE_USER	User	4dec3f3c-1006-47ea-816d-a00af77c49ef	\N	{"id": "4dec3f3c-1006-47ea-816d-a00af77c49ef", "role": "CITY_COORDINATOR", "email": "dima2@gmail.com", "cityId": "aadc7bed-f4de-4493-b16a-e256204eb6c9", "fullName": "shnv 22"}	a3a7a69e-dd76-4475-aa41-a2da784ddfd4	dima@gmail.com	AREA_MANAGER	\N	\N	\N	2025-12-15 19:01:17.715
bb9a167e-ae30-4796-a0be-0bdaacb679cb	CREATE_ACTIVIST_COORDINATOR_QUICK	ActivistCoordinator	ca866fb5-2221-4512-a24d-42f1c6c9c152	\N	{"email": "dima3@gmail.com", "title": "Activist Coordinator", "cityId": "aadc7bed-f4de-4493-b16a-e256204eb6c9", "userId": "e833fc36-0d25-414e-84c1-6d3785f3511c", "fullName": "יוסי", "activistCoordinatorId": "ca866fb5-2221-4512-a24d-42f1c6c9c152"}	a3a7a69e-dd76-4475-aa41-a2da784ddfd4	dima@gmail.com	AREA_MANAGER	\N	\N	\N	2025-12-15 19:03:57.307
daed3b07-19f8-47fa-9c8a-3f23b9926cd3	CREATE_NEIGHBORHOOD	Site	6594f36d-bf0d-4d86-acb7-f6c13d40af3d	\N	{"id": "6594f36d-bf0d-4d86-acb7-f6c13d40af3d", "city": null, "name": "שכונה א", "cityId": "aadc7bed-f4de-4493-b16a-e256204eb6c9", "isActive": true, "supervisorName": "יוסי", "activistCoordinatorId": "ca866fb5-2221-4512-a24d-42f1c6c9c152"}	a3a7a69e-dd76-4475-aa41-a2da784ddfd4	dima@gmail.com	AREA_MANAGER	\N	\N	\N	2025-12-15 19:04:12.448
6a093719-7819-4758-854a-b10533daa6d2	CREATE_WORKER	Worker	f75cf17a-bffe-457d-842f-f443c25f7138	\N	{"id": "f75cf17a-bffe-457d-842f-f443c25f7138", "fullName": "חנה", "isActive": true, "position": null, "neighborhoodId": "6594f36d-bf0d-4d86-acb7-f6c13d40af3d", "activistCoordinatorId": "ca866fb5-2221-4512-a24d-42f1c6c9c152"}	a3a7a69e-dd76-4475-aa41-a2da784ddfd4	dima@gmail.com	AREA_MANAGER	\N	\N	\N	2025-12-15 19:24:04.71
\.


--
-- Data for Name: cities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cities (id, name, code, description, logo_url, area_manager_id, email, phone, address, is_active, settings, metadata, created_at, updated_at) FROM stdin;
05bf816c-cbca-4f41-ba4e-f4208212e649	אבו גוש	abv-gvsh		\N	b9193146-d1e9-425c-8111-d4fd07b56f1e	\N	\N	\N	t	{}	\N	2025-12-15 18:56:12.417	2025-12-15 18:56:12.417
aadc7bed-f4de-4493-b16a-e256204eb6c9	ירושלים	jerusalem		\N	b9193146-d1e9-425c-8111-d4fd07b56f1e	\N	\N	\N	t	{}	\N	2025-12-15 18:56:51.069	2025-12-15 18:56:51.069
2eacc76c-46f9-4b63-a39e-a598d9503eca	תל אביב-יפו	TLV-YAFO	קמפיין בחירות תל אביב-יפו - עיר הבירה הכלכלית	\N	ba203c99-2b7c-45bd-baec-50ab49acbeab	\N	\N	\N	t	{}	\N	2025-12-14 23:21:38.45	2025-12-14 23:21:38.45
f400dbf5-47d7-4ef0-9914-2060811bae4a	רמת גן	RAMAT-GAN	קמפיין בחירות רמת גן - עיר היהלומים	\N	ba203c99-2b7c-45bd-baec-50ab49acbeab	\N	\N	\N	t	{}	\N	2025-12-14 23:21:39.319	2025-12-14 23:21:39.319
\.


--
-- Data for Name: city_coordinators; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.city_coordinators (id, city_id, user_id, title, is_active, metadata, created_at, updated_at) FROM stdin;
8d84b270-6e7d-4b4e-911a-79b6a558b6de	2eacc76c-46f9-4b63-a39e-a598d9503eca	0e94cf81-092e-432a-b824-764170cd4d84	מנהל קמפיין עירוני	t	{}	2025-12-14 23:21:38.576	2025-12-14 23:21:38.576
5eebfb74-f6a0-41d9-90bd-f91976421ea2	f400dbf5-47d7-4ef0-9914-2060811bae4a	c323ac2f-9970-46b3-bde4-c339b539c0a6	מנהל קמפיין עירוני	t	{}	2025-12-14 23:21:39.454	2025-12-14 23:21:39.454
20228540-a1dd-4a6a-a8e8-2bfdbe3a311e	aadc7bed-f4de-4493-b16a-e256204eb6c9	e9263b96-9c74-4e1b-a605-d4ba3ffa5d4e	Manager	t	{}	2025-12-15 18:58:34.979	2025-12-15 18:58:34.979
9d8284e3-d303-4a63-b172-51c6f6ee2107	aadc7bed-f4de-4493-b16a-e256204eb6c9	4dec3f3c-1006-47ea-816d-a00af77c49ef	Manager	t	{}	2025-12-15 19:01:17.697	2025-12-15 19:01:17.697
\.


--
-- Data for Name: invitations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invitations (id, email, role, status, token, message, expires_at, city_id, target_neighborhood_id, created_by_id, accepted_at, metadata, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: neighborhoods; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.neighborhoods (id, name, address, city, country, latitude, longitude, phone, email, is_active, metadata, city_id, created_at, updated_at) FROM stdin;
tlv-florentin	פלורנטין	רחוב ויטל 1	תל אביב	ישראל	32.0556	34.7661	+972-3-518-0001	florentin@campaign.test	t	{"population": 8000, "coverageArea": "2.5 km²", "targetVoters": 5500}	2eacc76c-46f9-4b63-a39e-a598d9503eca	2025-12-14 23:21:38.599	2025-12-14 23:21:38.599
tlv-neve-tzedek	נווה צדק	שדרות רוקח 1	תל אביב	ישראל	32.0608	34.763	+972-3-516-0002	nevetzedek@campaign.test	t	{"population": 6500, "coverageArea": "1.8 km²", "targetVoters": 4200}	2eacc76c-46f9-4b63-a39e-a598d9503eca	2025-12-14 23:21:38.624	2025-12-14 23:21:38.624
tlv-old-jaffa	יפו העתיקה	רחוב יפת 1	תל אביב-יפו	ישראל	32.0543	34.7516	+972-3-682-0003	oldjaffa@campaign.test	t	{"population": 12000, "coverageArea": "3.2 km²", "targetVoters": 7800}	2eacc76c-46f9-4b63-a39e-a598d9503eca	2025-12-14 23:21:38.641	2025-12-14 23:21:38.641
rg-center	מרכז העיר	ביאליק 1	רמת גן	ישראל	32.0809	34.8237	+972-3-575-0001	center@ramatgan.test	t	{"population": 15000, "targetVoters": 10500}	f400dbf5-47d7-4ef0-9914-2060811bae4a	2025-12-14 23:21:39.48	2025-12-14 23:21:39.48
6594f36d-bf0d-4d86-acb7-f6c13d40af3d	שכונה א	\N	\N	Israel	\N	\N	\N	\N	t	\N	aadc7bed-f4de-4493-b16a-e256204eb6c9	2025-12-15 19:04:12.181	2025-12-15 19:04:12.181
\.


--
-- Data for Name: push_subscriptions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.push_subscriptions (id, user_id, endpoint, p256dh, auth, user_agent, created_at, last_used_at) FROM stdin;
\.


--
-- Data for Name: task_assignments; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.task_assignments (id, task_id, target_user_id, status, read_at, acknowledged_at, archived_at, deleted_for_recipient_at, created_at) FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tasks (id, type, body, sender_user_id, execution_date, recipients_count, deleted_by_sender_at, created_at) FROM stdin;
\.


--
-- Data for Name: user_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_tokens (id, user_id, type, token, expires_at, used_at, created_at) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, full_name, phone, avatar_url, password_hash, role, is_active, is_super_admin, created_at, updated_at, last_login_at) FROM stdin;
f5da5ec1-be67-4a72-8c8c-412a9fc3da09	rachel.bendavid@telaviv.test	רחל בן-דוד	+972-54-400-0001	\N	$2a$10$Dp4bxLdEubboQGN3nnA7BuW5.1dbGLTefNqTRenl6tqRzu8.5TQYO	ACTIVIST_COORDINATOR	t	f	2025-12-14 23:21:38.759	2025-12-14 23:21:38.759	\N
c7009284-e6de-47d9-a873-0729cf025f65	yael.cohen@telaviv.test	יעל כהן	+972-54-400-0002	\N	$2a$10$.aXTa1f0xCX3rOPRCfZ0ZOSGR59pTOkJwgVCu1Uwym98F/N5DIxmi	ACTIVIST_COORDINATOR	t	f	2025-12-14 23:21:38.958	2025-12-14 23:21:38.958	\N
c323ac2f-9970-46b3-bde4-c339b539c0a6	moshe.israeli@ramatgan.test	משה ישראלי	+972-54-300-0002	\N	$2a$10$/AjSE2eTKvHPCipfASpyNODGRtwuyu5S3iQOuNeOY23OwrEXxTWji	CITY_COORDINATOR	t	f	2025-12-14 23:21:39.432	2025-12-14 23:21:39.432	\N
5cca662d-ae54-4be8-bea9-28f1cde3e344	dan.carmel@ramatgan.test	דן כרמל	+972-54-400-0003	\N	$2a$10$PrwC6ocJUACOLtYWxa7wW.OeqwhpM6W9GD.OS4fJJHr4Vns5Byzia	ACTIVIST_COORDINATOR	t	f	2025-12-14 23:21:39.611	2025-12-14 23:21:39.611	\N
a3a7a69e-dd76-4475-aa41-a2da784ddfd4	dima@gmail.com	דימה ירושלים	\N	\N	$2a$12$HrsfH51aP0x2MKQ4mGPoF.FBvqHxfrN9YvE3hsXsvX7Gez2WtZEJG	AREA_MANAGER	t	f	2025-12-15 17:59:32.242	2025-12-15 18:00:31.156	2025-12-15 18:00:31.155
e4b54c98-38d5-4f14-a477-48497043c993	admin@election.test	מנהל מערכת	+972-50-000-0000	\N	$2a$10$ML58t3rlbtJr7A4BkKpCyeKR4rKROu8.ERwwclMmXhySxit6JTZIG	SUPERADMIN	t	t	2025-12-14 23:21:37.106	2025-12-15 18:01:05.306	2025-12-15 18:01:05.305
e9263b96-9c74-4e1b-a605-d4ba3ffa5d4e	dima1@gmail.com	רכז עיר בדיקה	\N	\N	$2a$12$Jz3YEhPalgbj7XDyPpJC4.3A59h64guZfvxWNJghigZKy3hESOqXu	CITY_COORDINATOR	t	f	2025-12-15 18:58:34.858	2025-12-15 18:58:34.858	\N
4dec3f3c-1006-47ea-816d-a00af77c49ef	dima2@gmail.com	shnv 22	\N	\N	$2a$12$GvJxDzPruc4lbmpOoCY8G.PY9WcVLa/LEu8K1Pe1i/soMbBCltS9O	CITY_COORDINATOR	t	f	2025-12-15 19:01:17.67	2025-12-15 19:01:17.67	\N
e833fc36-0d25-414e-84c1-6d3785f3511c	dima3@gmail.com	יוסי		\N	$2a$12$VW9abikmFfURWo1QM.hx/eZl90HoQvLyebygTXKco5pSXzILF4GXO	ACTIVIST_COORDINATOR	t	f	2025-12-15 19:03:57.219	2025-12-15 19:03:57.219	\N
fc49f30a-0c00-43f7-a8a0-6e993307434c	sarah.cohen@telaviv-district.test	שרה כהן	+972-54-200-0001	\N	$2a$10$fmwQm9kOoHjk3KHELxOh5uteTLKiaXeQXdX.GMb/CzVTB.5vPgJYK	AREA_MANAGER	t	f	2025-12-14 23:21:37.261	2025-12-14 23:21:37.261	\N
308fd9e8-184e-4586-91b4-65615679c211	manager@north-district.test	יעל גולן	+972-54-200-0002	\N	$2a$10$eMaB6gvG9AWU18DBHdJRc.QMUSftSJmyGIArfqPympK5DzL1ohEne	AREA_MANAGER	t	f	2025-12-14 23:21:37.4	2025-12-14 23:21:37.4	\N
3578fee6-70c0-48a3-9119-510d68e2d9f3	manager@haifa-district.test	מיכאל כרמל	+972-54-200-0003	\N	$2a$10$ycx.9IF6.dc88wnbOj1.4OH/nodjzfDo5781j4PH1RBlSuXcNIqPu	AREA_MANAGER	t	f	2025-12-14 23:21:37.532	2025-12-14 23:21:37.532	\N
5827a4da-f3aa-4cdc-a713-40cd3a41cb95	manager@center-district.test	רונית שרון	+972-54-200-0004	\N	$2a$10$MLgDhl2j4Gno12eErfIbJeDZhBL8KjNLbDwHyqWE.KArwAB/jLh8C	AREA_MANAGER	t	f	2025-12-14 23:21:37.675	2025-12-14 23:21:37.675	\N
bb04255c-6837-4134-909d-8f8e075a22f9	manager@jerusalem-district.test	אבי הר-טוב	+972-54-200-0005	\N	$2a$10$o5cbbc19F1usD2WB/85zq.iz3TZioebPJ6q2xKrpykpL9JWao3xRO	AREA_MANAGER	t	f	2025-12-14 23:21:38.275	2025-12-14 23:21:38.275	\N
b712fffa-cb50-43a8-86ad-85081ad79b75	manager@south-district.test	תמר נגב	+972-54-200-0006	\N	$2a$10$9kWK.FNsZQ3e10Jlg5llmuGYYkmtIbZnRQYHz/mLqBtKishREFoPa	AREA_MANAGER	t	f	2025-12-14 23:21:38.418	2025-12-14 23:21:38.418	\N
0e94cf81-092e-432a-b824-764170cd4d84	david.levi@telaviv.test	דוד לוי	+972-54-300-0001	\N	$2a$10$E7oSnrJqd9oKcHFvRTG/0u7.oDTfnbCRMcj5FPeUbPtuaHg1Nj7V6	CITY_COORDINATOR	t	f	2025-12-14 23:21:38.565	2025-12-14 23:21:38.565	\N
\.


--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.push_subscriptions_id_seq', 1, false);


--
-- Name: task_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.task_assignments_id_seq', 1, false);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tasks_id_seq', 1, false);


--
-- Name: activist_coordinator_neighborhoods activist_coordinator_neighborhoods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activist_coordinator_neighborhoods
    ADD CONSTRAINT activist_coordinator_neighborhoods_pkey PRIMARY KEY (id);


--
-- Name: activist_coordinators activist_coordinators_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activist_coordinators
    ADD CONSTRAINT activist_coordinators_pkey PRIMARY KEY (id);


--
-- Name: activists activists_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activists
    ADD CONSTRAINT activists_pkey PRIMARY KEY (id);


--
-- Name: area_managers area_managers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.area_managers
    ADD CONSTRAINT area_managers_pkey PRIMARY KEY (id);


--
-- Name: attendance_records attendance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: cities cities_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_pkey PRIMARY KEY (id);


--
-- Name: city_coordinators city_coordinators_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city_coordinators
    ADD CONSTRAINT city_coordinators_pkey PRIMARY KEY (id);


--
-- Name: invitations invitations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_pkey PRIMARY KEY (id);


--
-- Name: neighborhoods neighborhoods_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.neighborhoods
    ADD CONSTRAINT neighborhoods_pkey PRIMARY KEY (id);


--
-- Name: push_subscriptions push_subscriptions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_pkey PRIMARY KEY (id);


--
-- Name: task_assignments task_assignments_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: user_tokens user_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tokens
    ADD CONSTRAINT user_tokens_pkey PRIMARY KEY (id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: activist_coordinator_neighborhoods_activist_coordinator_id__key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX activist_coordinator_neighborhoods_activist_coordinator_id__key ON public.activist_coordinator_neighborhoods USING btree (activist_coordinator_id, neighborhood_id);


--
-- Name: activist_coordinator_neighborhoods_activist_coordinator_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activist_coordinator_neighborhoods_activist_coordinator_id_idx ON public.activist_coordinator_neighborhoods USING btree (activist_coordinator_id);


--
-- Name: activist_coordinator_neighborhoods_city_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activist_coordinator_neighborhoods_city_id_idx ON public.activist_coordinator_neighborhoods USING btree (city_id);


--
-- Name: activist_coordinator_neighborhoods_legacy_activist_coordina_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activist_coordinator_neighborhoods_legacy_activist_coordina_idx ON public.activist_coordinator_neighborhoods USING btree (legacy_activist_coordinator_user_id);


--
-- Name: activist_coordinator_neighborhoods_neighborhood_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activist_coordinator_neighborhoods_neighborhood_id_idx ON public.activist_coordinator_neighborhoods USING btree (neighborhood_id);


--
-- Name: activist_coordinators_city_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activist_coordinators_city_id_idx ON public.activist_coordinators USING btree (city_id);


--
-- Name: activist_coordinators_city_id_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX activist_coordinators_city_id_user_id_key ON public.activist_coordinators USING btree (city_id, user_id);


--
-- Name: activist_coordinators_id_city_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX activist_coordinators_id_city_id_key ON public.activist_coordinators USING btree (id, city_id);


--
-- Name: activist_coordinators_is_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activist_coordinators_is_active_idx ON public.activist_coordinators USING btree (is_active);


--
-- Name: activist_coordinators_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activist_coordinators_user_id_idx ON public.activist_coordinators USING btree (user_id);


--
-- Name: activists_activist_coordinator_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activists_activist_coordinator_id_idx ON public.activists USING btree (activist_coordinator_id);


--
-- Name: activists_city_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activists_city_id_idx ON public.activists USING btree (city_id);


--
-- Name: activists_is_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activists_is_active_idx ON public.activists USING btree (is_active);


--
-- Name: activists_neighborhood_id_full_name_phone_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX activists_neighborhood_id_full_name_phone_key ON public.activists USING btree (neighborhood_id, full_name, phone);


--
-- Name: activists_neighborhood_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activists_neighborhood_id_idx ON public.activists USING btree (neighborhood_id);


--
-- Name: activists_phone_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX activists_phone_idx ON public.activists USING btree (phone);


--
-- Name: area_managers_is_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX area_managers_is_active_idx ON public.area_managers USING btree (is_active);


--
-- Name: area_managers_region_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX area_managers_region_code_idx ON public.area_managers USING btree (region_code);


--
-- Name: area_managers_region_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX area_managers_region_code_key ON public.area_managers USING btree (region_code);


--
-- Name: area_managers_region_name_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX area_managers_region_name_idx ON public.area_managers USING btree (region_name);


--
-- Name: area_managers_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX area_managers_user_id_idx ON public.area_managers USING btree (user_id);


--
-- Name: area_managers_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX area_managers_user_id_key ON public.area_managers USING btree (user_id);


--
-- Name: attendance_records_activist_id_date_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX attendance_records_activist_id_date_key ON public.attendance_records USING btree (activist_id, date);


--
-- Name: attendance_records_city_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attendance_records_city_id_date_idx ON public.attendance_records USING btree (city_id, date);


--
-- Name: attendance_records_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attendance_records_date_idx ON public.attendance_records USING btree (date);


--
-- Name: attendance_records_is_within_geofence_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attendance_records_is_within_geofence_idx ON public.attendance_records USING btree (is_within_geofence);


--
-- Name: attendance_records_last_edited_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attendance_records_last_edited_at_idx ON public.attendance_records USING btree (last_edited_at);


--
-- Name: attendance_records_neighborhood_id_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX attendance_records_neighborhood_id_date_idx ON public.attendance_records USING btree (neighborhood_id, date);


--
-- Name: audit_logs_action_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_action_idx ON public.audit_logs USING btree (action);


--
-- Name: audit_logs_city_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_city_id_idx ON public.audit_logs USING btree (city_id);


--
-- Name: audit_logs_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_created_at_idx ON public.audit_logs USING btree (created_at);


--
-- Name: audit_logs_entity_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_entity_id_idx ON public.audit_logs USING btree (entity_id);


--
-- Name: audit_logs_entity_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_entity_idx ON public.audit_logs USING btree (entity);


--
-- Name: audit_logs_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX audit_logs_user_id_idx ON public.audit_logs USING btree (user_id);


--
-- Name: cities_area_manager_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cities_area_manager_id_idx ON public.cities USING btree (area_manager_id);


--
-- Name: cities_code_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cities_code_idx ON public.cities USING btree (code);


--
-- Name: cities_code_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX cities_code_key ON public.cities USING btree (code);


--
-- Name: cities_is_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX cities_is_active_idx ON public.cities USING btree (is_active);


--
-- Name: city_coordinators_city_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX city_coordinators_city_id_idx ON public.city_coordinators USING btree (city_id);


--
-- Name: city_coordinators_city_id_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX city_coordinators_city_id_user_id_key ON public.city_coordinators USING btree (city_id, user_id);


--
-- Name: city_coordinators_is_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX city_coordinators_is_active_idx ON public.city_coordinators USING btree (is_active);


--
-- Name: city_coordinators_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX city_coordinators_user_id_idx ON public.city_coordinators USING btree (user_id);


--
-- Name: invitations_city_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invitations_city_id_idx ON public.invitations USING btree (city_id);


--
-- Name: invitations_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invitations_email_idx ON public.invitations USING btree (email);


--
-- Name: invitations_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invitations_status_idx ON public.invitations USING btree (status);


--
-- Name: invitations_target_neighborhood_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invitations_target_neighborhood_id_idx ON public.invitations USING btree (target_neighborhood_id);


--
-- Name: invitations_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX invitations_token_idx ON public.invitations USING btree (token);


--
-- Name: invitations_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX invitations_token_key ON public.invitations USING btree (token);


--
-- Name: neighborhoods_city_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX neighborhoods_city_id_idx ON public.neighborhoods USING btree (city_id);


--
-- Name: neighborhoods_id_city_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX neighborhoods_id_city_id_key ON public.neighborhoods USING btree (id, city_id);


--
-- Name: neighborhoods_is_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX neighborhoods_is_active_idx ON public.neighborhoods USING btree (is_active);


--
-- Name: push_subscriptions_last_used_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX push_subscriptions_last_used_at_idx ON public.push_subscriptions USING btree (last_used_at);


--
-- Name: push_subscriptions_user_id_endpoint_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX push_subscriptions_user_id_endpoint_key ON public.push_subscriptions USING btree (user_id, endpoint);


--
-- Name: push_subscriptions_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX push_subscriptions_user_id_idx ON public.push_subscriptions USING btree (user_id);


--
-- Name: task_assignments_deleted_for_recipient_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX task_assignments_deleted_for_recipient_at_idx ON public.task_assignments USING btree (deleted_for_recipient_at);


--
-- Name: task_assignments_target_user_id_archived_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX task_assignments_target_user_id_archived_at_idx ON public.task_assignments USING btree (target_user_id, archived_at);


--
-- Name: task_assignments_target_user_id_status_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX task_assignments_target_user_id_status_idx ON public.task_assignments USING btree (target_user_id, status);


--
-- Name: task_assignments_task_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX task_assignments_task_id_idx ON public.task_assignments USING btree (task_id);


--
-- Name: task_assignments_task_id_target_user_id_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX task_assignments_task_id_target_user_id_key ON public.task_assignments USING btree (task_id, target_user_id);


--
-- Name: tasks_created_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasks_created_at_idx ON public.tasks USING btree (created_at DESC);


--
-- Name: tasks_deleted_by_sender_at_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasks_deleted_by_sender_at_idx ON public.tasks USING btree (deleted_by_sender_at);


--
-- Name: tasks_execution_date_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasks_execution_date_idx ON public.tasks USING btree (execution_date);


--
-- Name: tasks_sender_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX tasks_sender_user_id_idx ON public.tasks USING btree (sender_user_id);


--
-- Name: user_tokens_token_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_tokens_token_idx ON public.user_tokens USING btree (token);


--
-- Name: user_tokens_token_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX user_tokens_token_key ON public.user_tokens USING btree (token);


--
-- Name: user_tokens_type_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_tokens_type_idx ON public.user_tokens USING btree (type);


--
-- Name: user_tokens_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX user_tokens_user_id_idx ON public.user_tokens USING btree (user_id);


--
-- Name: users_email_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_email_idx ON public.users USING btree (email);


--
-- Name: users_email_key; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX users_email_key ON public.users USING btree (email);


--
-- Name: users_is_active_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_is_active_idx ON public.users USING btree (is_active);


--
-- Name: users_is_super_admin_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX users_is_super_admin_idx ON public.users USING btree (is_super_admin);


--
-- Name: activist_coordinator_neighborhoods activist_coordinator_neighborhoods_activist_coordinator_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activist_coordinator_neighborhoods
    ADD CONSTRAINT activist_coordinator_neighborhoods_activist_coordinator_id_fkey FOREIGN KEY (activist_coordinator_id, city_id) REFERENCES public.activist_coordinators(id, city_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: activist_coordinator_neighborhoods activist_coordinator_neighborhoods_legacy_activist_coordin_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activist_coordinator_neighborhoods
    ADD CONSTRAINT activist_coordinator_neighborhoods_legacy_activist_coordin_fkey FOREIGN KEY (legacy_activist_coordinator_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: activist_coordinator_neighborhoods activist_coordinator_neighborhoods_neighborhood_id_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activist_coordinator_neighborhoods
    ADD CONSTRAINT activist_coordinator_neighborhoods_neighborhood_id_city_id_fkey FOREIGN KEY (neighborhood_id, city_id) REFERENCES public.neighborhoods(id, city_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: activist_coordinators activist_coordinators_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activist_coordinators
    ADD CONSTRAINT activist_coordinators_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: activist_coordinators activist_coordinators_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activist_coordinators
    ADD CONSTRAINT activist_coordinators_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: activists activists_activist_coordinator_id_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activists
    ADD CONSTRAINT activists_activist_coordinator_id_city_id_fkey FOREIGN KEY (activist_coordinator_id, city_id) REFERENCES public.activist_coordinators(id, city_id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: activists activists_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activists
    ADD CONSTRAINT activists_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: activists activists_neighborhood_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activists
    ADD CONSTRAINT activists_neighborhood_id_fkey FOREIGN KEY (neighborhood_id) REFERENCES public.neighborhoods(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: area_managers area_managers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.area_managers
    ADD CONSTRAINT area_managers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: attendance_records attendance_records_activist_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_activist_id_fkey FOREIGN KEY (activist_id) REFERENCES public.activists(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: attendance_records attendance_records_checked_in_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_checked_in_by_id_fkey FOREIGN KEY (checked_in_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: attendance_records attendance_records_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: attendance_records attendance_records_last_edited_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_last_edited_by_id_fkey FOREIGN KEY (last_edited_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


--
-- Name: attendance_records attendance_records_neighborhood_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_neighborhood_id_fkey FOREIGN KEY (neighborhood_id) REFERENCES public.neighborhoods(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: cities cities_area_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.cities
    ADD CONSTRAINT cities_area_manager_id_fkey FOREIGN KEY (area_manager_id) REFERENCES public.area_managers(id) ON UPDATE CASCADE ON DELETE RESTRICT;


--
-- Name: city_coordinators city_coordinators_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city_coordinators
    ADD CONSTRAINT city_coordinators_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: city_coordinators city_coordinators_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.city_coordinators
    ADD CONSTRAINT city_coordinators_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invitations invitations_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: invitations invitations_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invitations
    ADD CONSTRAINT invitations_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: neighborhoods neighborhoods_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.neighborhoods
    ADD CONSTRAINT neighborhoods_city_id_fkey FOREIGN KEY (city_id) REFERENCES public.cities(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: push_subscriptions push_subscriptions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.push_subscriptions
    ADD CONSTRAINT push_subscriptions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_assignments task_assignments_target_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_target_user_id_fkey FOREIGN KEY (target_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: task_assignments task_assignments_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.task_assignments
    ADD CONSTRAINT task_assignments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: tasks tasks_sender_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_sender_user_id_fkey FOREIGN KEY (sender_user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: user_tokens user_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_tokens
    ADD CONSTRAINT user_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

\unrestrict Iu0tQw98iLXrYU7sa5ZthM4ZxH44IRJDYt56MaVJgKYlraodJGFuV2JQtIHisPF

