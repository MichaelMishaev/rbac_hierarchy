--
-- PostgreSQL database dump
--

-- Dumped from database version 15.14
-- Dumped by pg_dump version 16.9 (Homebrew)

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

ALTER TABLE IF EXISTS ONLY public.user_tokens DROP CONSTRAINT IF EXISTS user_tokens_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS tasks_sender_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.task_assignments DROP CONSTRAINT IF EXISTS task_assignments_task_id_fkey;
ALTER TABLE IF EXISTS ONLY public.task_assignments DROP CONSTRAINT IF EXISTS task_assignments_target_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.neighborhoods DROP CONSTRAINT IF EXISTS neighborhoods_city_id_fkey;
ALTER TABLE IF EXISTS ONLY public.invitations DROP CONSTRAINT IF EXISTS invitations_created_by_id_fkey;
ALTER TABLE IF EXISTS ONLY public.invitations DROP CONSTRAINT IF EXISTS invitations_city_id_fkey;
ALTER TABLE IF EXISTS ONLY public.city_coordinators DROP CONSTRAINT IF EXISTS city_coordinators_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.city_coordinators DROP CONSTRAINT IF EXISTS city_coordinators_city_id_fkey;
ALTER TABLE IF EXISTS ONLY public.cities DROP CONSTRAINT IF EXISTS cities_area_manager_id_fkey;
ALTER TABLE IF EXISTS ONLY public.attendance_records DROP CONSTRAINT IF EXISTS attendance_records_neighborhood_id_fkey;
ALTER TABLE IF EXISTS ONLY public.attendance_records DROP CONSTRAINT IF EXISTS attendance_records_last_edited_by_id_fkey;
ALTER TABLE IF EXISTS ONLY public.attendance_records DROP CONSTRAINT IF EXISTS attendance_records_city_id_fkey;
ALTER TABLE IF EXISTS ONLY public.attendance_records DROP CONSTRAINT IF EXISTS attendance_records_checked_in_by_id_fkey;
ALTER TABLE IF EXISTS ONLY public.attendance_records DROP CONSTRAINT IF EXISTS attendance_records_activist_id_fkey;
ALTER TABLE IF EXISTS ONLY public.area_managers DROP CONSTRAINT IF EXISTS area_managers_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.activists DROP CONSTRAINT IF EXISTS activists_neighborhood_id_city_id_fkey;
ALTER TABLE IF EXISTS ONLY public.activists DROP CONSTRAINT IF EXISTS activists_city_id_fkey;
ALTER TABLE IF EXISTS ONLY public.activists DROP CONSTRAINT IF EXISTS activists_activist_coordinator_id_city_id_fkey;
ALTER TABLE IF EXISTS ONLY public.activist_coordinators DROP CONSTRAINT IF EXISTS activist_coordinators_user_id_fkey;
ALTER TABLE IF EXISTS ONLY public.activist_coordinators DROP CONSTRAINT IF EXISTS activist_coordinators_city_id_fkey;
ALTER TABLE IF EXISTS ONLY public.activist_coordinator_neighborhoods DROP CONSTRAINT IF EXISTS activist_coordinator_neighborhoods_neighborhood_id_city_id_fkey;
ALTER TABLE IF EXISTS ONLY public.activist_coordinator_neighborhoods DROP CONSTRAINT IF EXISTS activist_coordinator_neighborhoods_legacy_activist_coordin_fkey;
ALTER TABLE IF EXISTS ONLY public.activist_coordinator_neighborhoods DROP CONSTRAINT IF EXISTS activist_coordinator_neighborhoods_activist_coordinator_id_fkey;
DROP INDEX IF EXISTS public.users_is_super_admin_idx;
DROP INDEX IF EXISTS public.users_is_active_idx;
DROP INDEX IF EXISTS public.users_email_key;
DROP INDEX IF EXISTS public.users_email_idx;
DROP INDEX IF EXISTS public.user_tokens_user_id_idx;
DROP INDEX IF EXISTS public.user_tokens_type_idx;
DROP INDEX IF EXISTS public.user_tokens_token_key;
DROP INDEX IF EXISTS public.user_tokens_token_idx;
DROP INDEX IF EXISTS public.tasks_sender_user_id_idx;
DROP INDEX IF EXISTS public.tasks_execution_date_idx;
DROP INDEX IF EXISTS public.tasks_deleted_by_sender_at_idx;
DROP INDEX IF EXISTS public.tasks_created_at_idx;
DROP INDEX IF EXISTS public.task_assignments_task_id_target_user_id_key;
DROP INDEX IF EXISTS public.task_assignments_task_id_idx;
DROP INDEX IF EXISTS public.task_assignments_target_user_id_status_idx;
DROP INDEX IF EXISTS public.task_assignments_target_user_id_archived_at_idx;
DROP INDEX IF EXISTS public.task_assignments_deleted_for_recipient_at_idx;
DROP INDEX IF EXISTS public.push_subscriptions_user_id_idx;
DROP INDEX IF EXISTS public.push_subscriptions_user_id_endpoint_key;
DROP INDEX IF EXISTS public.push_subscriptions_last_used_at_idx;
DROP INDEX IF EXISTS public.neighborhoods_is_active_idx;
DROP INDEX IF EXISTS public.neighborhoods_id_city_id_key;
DROP INDEX IF EXISTS public.neighborhoods_city_id_idx;
DROP INDEX IF EXISTS public.invitations_token_key;
DROP INDEX IF EXISTS public.invitations_token_idx;
DROP INDEX IF EXISTS public.invitations_target_neighborhood_id_idx;
DROP INDEX IF EXISTS public.invitations_status_idx;
DROP INDEX IF EXISTS public.invitations_email_idx;
DROP INDEX IF EXISTS public.invitations_city_id_idx;
DROP INDEX IF EXISTS public.city_coordinators_user_id_idx;
DROP INDEX IF EXISTS public.city_coordinators_is_active_idx;
DROP INDEX IF EXISTS public.city_coordinators_city_id_user_id_key;
DROP INDEX IF EXISTS public.city_coordinators_city_id_idx;
DROP INDEX IF EXISTS public.cities_is_active_idx;
DROP INDEX IF EXISTS public.cities_code_key;
DROP INDEX IF EXISTS public.cities_code_idx;
DROP INDEX IF EXISTS public.cities_area_manager_id_idx;
DROP INDEX IF EXISTS public.audit_logs_user_id_idx;
DROP INDEX IF EXISTS public.audit_logs_entity_idx;
DROP INDEX IF EXISTS public.audit_logs_entity_id_idx;
DROP INDEX IF EXISTS public.audit_logs_created_at_idx;
DROP INDEX IF EXISTS public.audit_logs_city_id_idx;
DROP INDEX IF EXISTS public.audit_logs_action_idx;
DROP INDEX IF EXISTS public.attendance_records_neighborhood_id_date_idx;
DROP INDEX IF EXISTS public.attendance_records_last_edited_at_idx;
DROP INDEX IF EXISTS public.attendance_records_is_within_geofence_idx;
DROP INDEX IF EXISTS public.attendance_records_date_idx;
DROP INDEX IF EXISTS public.attendance_records_city_id_date_idx;
DROP INDEX IF EXISTS public.attendance_records_activist_id_date_key;
DROP INDEX IF EXISTS public.area_managers_user_id_key;
DROP INDEX IF EXISTS public.area_managers_user_id_idx;
DROP INDEX IF EXISTS public.area_managers_region_name_idx;
DROP INDEX IF EXISTS public.area_managers_region_code_key;
DROP INDEX IF EXISTS public.area_managers_region_code_idx;
DROP INDEX IF EXISTS public.area_managers_is_active_idx;
DROP INDEX IF EXISTS public.activists_phone_idx;
DROP INDEX IF EXISTS public.activists_neighborhood_id_idx;
DROP INDEX IF EXISTS public.activists_neighborhood_id_full_name_phone_key;
DROP INDEX IF EXISTS public.activists_is_active_idx;
DROP INDEX IF EXISTS public.activists_city_id_idx;
DROP INDEX IF EXISTS public.activists_activist_coordinator_id_idx;
DROP INDEX IF EXISTS public.activist_coordinators_user_id_idx;
DROP INDEX IF EXISTS public.activist_coordinators_is_active_idx;
DROP INDEX IF EXISTS public.activist_coordinators_id_city_id_key;
DROP INDEX IF EXISTS public.activist_coordinators_city_id_user_id_key;
DROP INDEX IF EXISTS public.activist_coordinators_city_id_idx;
DROP INDEX IF EXISTS public.activist_coordinator_neighborhoods_neighborhood_id_idx;
DROP INDEX IF EXISTS public.activist_coordinator_neighborhoods_legacy_activist_coordina_idx;
DROP INDEX IF EXISTS public.activist_coordinator_neighborhoods_city_id_idx;
DROP INDEX IF EXISTS public.activist_coordinator_neighborhoods_activist_coordinator_id_idx;
DROP INDEX IF EXISTS public.activist_coordinator_neighborhoods_activist_coordinator_id__key;
ALTER TABLE IF EXISTS ONLY public.users DROP CONSTRAINT IF EXISTS users_pkey;
ALTER TABLE IF EXISTS ONLY public.user_tokens DROP CONSTRAINT IF EXISTS user_tokens_pkey;
ALTER TABLE IF EXISTS ONLY public.tasks DROP CONSTRAINT IF EXISTS tasks_pkey;
ALTER TABLE IF EXISTS ONLY public.task_assignments DROP CONSTRAINT IF EXISTS task_assignments_pkey;
ALTER TABLE IF EXISTS ONLY public.push_subscriptions DROP CONSTRAINT IF EXISTS push_subscriptions_pkey;
ALTER TABLE IF EXISTS ONLY public.neighborhoods DROP CONSTRAINT IF EXISTS neighborhoods_pkey;
ALTER TABLE IF EXISTS ONLY public.invitations DROP CONSTRAINT IF EXISTS invitations_pkey;
ALTER TABLE IF EXISTS ONLY public.city_coordinators DROP CONSTRAINT IF EXISTS city_coordinators_pkey;
ALTER TABLE IF EXISTS ONLY public.cities DROP CONSTRAINT IF EXISTS cities_pkey;
ALTER TABLE IF EXISTS ONLY public.audit_logs DROP CONSTRAINT IF EXISTS audit_logs_pkey;
ALTER TABLE IF EXISTS ONLY public.attendance_records DROP CONSTRAINT IF EXISTS attendance_records_pkey;
ALTER TABLE IF EXISTS ONLY public.area_managers DROP CONSTRAINT IF EXISTS area_managers_pkey;
ALTER TABLE IF EXISTS ONLY public.activists DROP CONSTRAINT IF EXISTS activists_pkey;
ALTER TABLE IF EXISTS ONLY public.activist_coordinators DROP CONSTRAINT IF EXISTS activist_coordinators_pkey;
ALTER TABLE IF EXISTS ONLY public.activist_coordinator_neighborhoods DROP CONSTRAINT IF EXISTS activist_coordinator_neighborhoods_pkey;
ALTER TABLE IF EXISTS public.tasks ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.task_assignments ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public.push_subscriptions ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public.users;
DROP TABLE IF EXISTS public.user_tokens;
DROP SEQUENCE IF EXISTS public.tasks_id_seq;
DROP TABLE IF EXISTS public.tasks;
DROP SEQUENCE IF EXISTS public.task_assignments_id_seq;
DROP TABLE IF EXISTS public.task_assignments;
DROP SEQUENCE IF EXISTS public.push_subscriptions_id_seq;
DROP TABLE IF EXISTS public.push_subscriptions;
DROP TABLE IF EXISTS public.neighborhoods;
DROP TABLE IF EXISTS public.invitations;
DROP TABLE IF EXISTS public.city_coordinators;
DROP TABLE IF EXISTS public.cities;
DROP TABLE IF EXISTS public.audit_logs;
DROP TABLE IF EXISTS public.attendance_records;
DROP TABLE IF EXISTS public.area_managers;
DROP TABLE IF EXISTS public.activists;
DROP TABLE IF EXISTS public.activist_coordinators;
DROP TABLE IF EXISTS public.activist_coordinator_neighborhoods;
DROP TYPE IF EXISTS public.attendance_status;
DROP TYPE IF EXISTS public."TokenType";
DROP TYPE IF EXISTS public."Role";
DROP TYPE IF EXISTS public."InvitationStatus";
-- *not* dropping schema, since initdb creates it
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
    user_id text,
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
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp with time zone NOT NULL,
    checked_in_accuracy double precision,
    checked_in_gps_time timestamp with time zone,
    checked_in_latitude double precision,
    checked_in_longitude double precision,
    distance_from_site double precision,
    is_within_geofence boolean DEFAULT true NOT NULL
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
28465450-ad86-4f60-904b-61dd51250c74	173de3d7-595b-45a4-b1e7-8587a214bf8d	f7ad2c36-3032-450d-b720-5bc11338e2bd	ff5ed4e2-12af-450b-b977-b3f6270bcb21	f167e928-22c1-49ea-a79b-a84d88e79470	2025-12-14 22:14:21.264	b5ea00aa-2eb6-4e07-98fa-0738c69f2cbb	\N	2025-12-14 22:14:21.264	2025-12-14 22:14:21.264
\.


--
-- Data for Name: activist_coordinators; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activist_coordinators (id, city_id, user_id, title, is_active, metadata, created_at, updated_at) FROM stdin;
f7ad2c36-3032-450d-b720-5bc11338e2bd	173de3d7-595b-45a4-b1e7-8587a214bf8d	f167e928-22c1-49ea-a79b-a84d88e79470	Activist Coordinator	t	{}	2025-12-14 22:12:51.927	2025-12-14 22:12:51.927
\.


--
-- Data for Name: activists; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activists (id, full_name, phone, email, "position", avatar_url, start_date, end_date, is_active, notes, tags, metadata, city_id, neighborhood_id, activist_coordinator_id, created_at, updated_at) FROM stdin;
ccb22caf-cece-435e-ba07-de0778081225	פעיל דביל	\N	\N	\N	\N	2025-12-14 00:00:00	\N	t	\N	{}	\N	173de3d7-595b-45a4-b1e7-8587a214bf8d	ff5ed4e2-12af-450b-b977-b3f6270bcb21	f7ad2c36-3032-450d-b720-5bc11338e2bd	2025-12-14 22:22:21.351	2025-12-14 22:22:21.351
5268abdf-16a3-4654-b703-7997768dea27	פעיל מספר 2	\N	\N	\N	\N	2025-12-14 00:00:00	\N	t	\N	{}	\N	173de3d7-595b-45a4-b1e7-8587a214bf8d	ff5ed4e2-12af-450b-b977-b3f6270bcb21	f7ad2c36-3032-450d-b720-5bc11338e2bd	2025-12-14 22:23:53.733	2025-12-14 22:23:53.733
0db5fdfa-706f-4b83-ba9a-e240a235e2cc	פעיל מספר 3	\N	\N	\N	\N	2025-12-14 00:00:00	\N	t	\N	{}	\N	173de3d7-595b-45a4-b1e7-8587a214bf8d	ff5ed4e2-12af-450b-b977-b3f6270bcb21	f7ad2c36-3032-450d-b720-5bc11338e2bd	2025-12-14 22:30:23.715	2025-12-14 22:30:23.715
c85bf998-aa96-4265-91a5-281544759d0b	פעיל 4	0544654465	aasd@asd.com	מזדבל22	\N	2025-12-14 00:00:00	\N	t	\N	{"משמרת לילה"}	\N	173de3d7-595b-45a4-b1e7-8587a214bf8d	ff5ed4e2-12af-450b-b977-b3f6270bcb21	f7ad2c36-3032-450d-b720-5bc11338e2bd	2025-12-14 22:35:12.408	2025-12-14 22:56:49.62
b5faf0d1-8c92-4192-9ec7-fd67ccad32db	debil 1	\N	\N	\N	\N	2025-12-14 00:00:00	\N	t	\N	{}	\N	173de3d7-595b-45a4-b1e7-8587a214bf8d	ff5ed4e2-12af-450b-b977-b3f6270bcb21	f7ad2c36-3032-450d-b720-5bc11338e2bd	2025-12-14 22:57:35.452	2025-12-14 22:57:35.452
\.


--
-- Data for Name: area_managers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.area_managers (id, user_id, region_code, region_name, is_active, metadata, created_at, updated_at) FROM stdin;
ae1479db-9557-4fb9-9b37-b2786abdbbea	\N	CENTER	מחוז המרכז	t	{"area": "1,294 km²", "capital": "רמלה", "population": 2329500}	2025-12-14 21:37:48.391	2025-12-14 22:11:04.154
c862f895-9ec8-483a-af59-850d1f80dfe5	\N	TEL_AVIV	מחוז תל אביב	t	{"area": "172 km²", "note": "המחוז הקטן ביותר אך הצפוף ביותר", "capital": "תל אביב-יפו", "population": 1423300}	2025-12-14 21:37:48.394	2025-12-14 22:11:04.157
ea2b9287-b1bc-4461-b8db-14e1d3bc7dd6	\N	SOUTH	מחוז הדרום	t	{"area": "14,231 km²", "note": "המחוז הגדול ביותר - כולל את הנגב", "capital": "באר שבע", "population": 1244200}	2025-12-14 21:37:48.397	2025-12-14 22:11:04.159
41d20518-0d85-49fb-9784-60dc6f7f861d	fae5ade5-d4f3-4515-bd3f-b1d4b319a1c6	TA-DISTRICT	מחוז תל אביב	t	{"description": "מנהלת אזורית אחראית על קמפיין הבחירות במחוז תל אביב"}	2025-12-14 22:54:45.964	2025-12-14 22:54:45.964
042c022e-f009-4bbc-9d5f-80dd35b926c0	b5ea00aa-2eb6-4e07-98fa-0738c69f2cbb	NORTH	מחוז הצפון	t	{"area": "4,478 km²", "capital": "נצרת", "population": 1401900}	2025-12-14 21:37:48.387	2025-12-14 21:54:57.591
24fe2588-1cce-4c48-a387-a01a47d7564f	\N	JERUSALEM	מחוז ירושלים	t	{"area": "652 km²", "capital": "ירושלים", "population": 1253900}	2025-12-14 21:37:48.375	2025-12-14 22:11:04.146
8990359e-cc48-45a1-8950-eb07274d5b02	\N	HAIFA	מחוז חיפה	t	{"area": "864 km²", "capital": "חיפה", "population": 1014500}	2025-12-14 21:37:48.389	2025-12-14 22:11:04.152
\.


--
-- Data for Name: attendance_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendance_records (id, activist_id, neighborhood_id, city_id, date, checked_in_at, status, checked_in_by_id, notes, last_edited_by_id, last_edited_at, edit_reason, created_at, updated_at, checked_in_accuracy, checked_in_gps_time, checked_in_latitude, checked_in_longitude, distance_from_site, is_within_geofence) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, action, entity, entity_id, before, after, user_id, user_email, user_role, city_id, ip_address, user_agent, created_at) FROM stdin;
baad64a1-e8f0-42ee-9441-cf5fda9c678c	CREATE	attendance_record	c2bdd818-c655-4a59-86e0-bc003513b98f	null	{"status": "PRESENT", "checkedInAt": "2025-12-10T17:31:37.203Z"}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	ff50ceaf-2bd7-4514-841c-d459b7ecc8d4	\N	\N	2025-12-10 17:31:37.221
3cdd554e-56d1-447e-8074-c20e3732424d	UPDATE	attendance_record	c2bdd818-c655-4a59-86e0-bc003513b98f	{"status": "PRESENT", "checkedInAt": "2025-12-10T17:31:37.203Z"}	{"status": "PRESENT", "checkedInAt": "2025-12-10T17:31:38.702Z"}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	ff50ceaf-2bd7-4514-841c-d459b7ecc8d4	\N	\N	2025-12-10 17:31:38.709
3444b91a-90a8-4846-bac9-37b633388c0f	UPDATE	attendance_record	c2bdd818-c655-4a59-86e0-bc003513b98f	{"status": "PRESENT", "checkedInAt": "2025-12-10T17:31:38.702Z"}	{"status": "PRESENT", "checkedInAt": "2025-12-10T17:31:43.888Z"}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	ff50ceaf-2bd7-4514-841c-d459b7ecc8d4	\N	\N	2025-12-10 17:31:43.893
12831539-557b-4074-be2c-38f9fe8c775d	UPDATE_NEIGHBORHOOD	Site	tlv-old-jaffa	{"city": "תל אביב-יפו", "name": "יפו העתיקה", "address": "רחוב יפת 1", "isActive": true}	{"city": "תל אביב-יפו", "name": "יפו העתיקה", "address": "רחוב יפת 1", "isActive": true}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-10 22:23:25.767
fd49ae80-1c9f-4f7b-a906-c3bca1842b5c	CREATE_NEIGHBORHOOD	Site	7b702325-bcbb-4d97-82c8-9275a233b6b9	\N	{"id": "7b702325-bcbb-4d97-82c8-9275a233b6b9", "city": null, "name": "test", "cityId": "f0437968-2167-4983-bf5d-512e76131f58", "isActive": true, "supervisorName": "דן כרמל", "activistCoordinatorId": "7cbd8978-6535-4e83-8a97-ecc09118acd8"}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-11 08:02:18.613
64120f09-3416-49fd-b7d9-fe09c2239682	UPDATE_NEIGHBORHOOD	Site	7b702325-bcbb-4d97-82c8-9275a233b6b9	{"city": null, "name": "test", "address": null, "isActive": true}	{"city": null, "name": "2test", "address": null, "isActive": true}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-11 08:02:37.498
3ea11ef8-65e8-46a2-8248-061654021f82	DELETE_NEIGHBORHOOD	Site	7b702325-bcbb-4d97-82c8-9275a233b6b9	{"id": "7b702325-bcbb-4d97-82c8-9275a233b6b9", "city": null, "name": "2test", "workerCount": 0, "supervisorCount": 1}	\N	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-11 08:03:06.055
6ba92ea7-c68f-4c90-9910-e3eb208de3de	CREATE_USER	User	5f6d22e8-c4be-4342-857b-8c1ded5da587	\N	{"id": "5f6d22e8-c4be-4342-857b-8c1ded5da587", "role": "AREA_MANAGER", "email": "asdasd@gmail.com", "fullName": "testUser"}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-11 08:32:40.742
d768cb0d-9499-419f-a9f3-b841d482d79f	CREATE_USER	User	6e8da55b-08c7-4068-a4c2-8d69cc96e8d4	\N	{"id": "6e8da55b-08c7-4068-a4c2-8d69cc96e8d4", "role": "AREA_MANAGER", "email": "add@aa.com", "fullName": "testTetst"}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-11 08:35:05.958
712f7482-6129-4804-84dd-4f300fd4ce71	CREATE_USER	User	05c3c62e-c547-43df-8f38-2acb2e053a32	\N	{"id": "05c3c62e-c547-43df-8f38-2acb2e053a32", "role": "AREA_MANAGER", "email": "test3@asd.com", "fullName": "test2"}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-11 09:25:13.876
2cc3d132-49c9-4680-8bf1-7d564143dad3	UPDATE_AREA_MANAGER	AreaManager	ee37b800-f3eb-495f-b05a-e192038aa8c4	{"userId": "6e8da55b-08c7-4068-a4c2-8d69cc96e8d4", "isActive": true, "userEmail": "add@aa.com", "regionCode": "REGION-1765442105955", "regionName": "מחוז הצפון"}	{"userId": "05c3c62e-c547-43df-8f38-2acb2e053a32", "isActive": true, "userEmail": "test3@asd.com", "regionCode": "REGION-1765442105955", "regionName": "מחוז הצפון"}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-11 09:25:31.375
7e663479-8690-4a87-b4cb-588010821625	CREATE_ACTIVIST_COORDINATOR_QUICK	ActivistCoordinator	d71ce1d7-417d-46cc-82a3-c8af0548d0bb	\N	{"email": "asd@gmail.com", "title": "מפקח", "cityId": "96df1319-2db7-4c75-88bb-b578eeaf3649", "userId": "0bf1ba25-2110-490a-bf6e-96cba0be6f81", "fullName": "מפקח לעיר ערד", "activistCoordinatorId": "d71ce1d7-417d-46cc-82a3-c8af0548d0bb"}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-11 13:00:32.164
dcf264a5-9b10-41bd-ad17-619a9ca06c23	CREATE_USER	User	7e5f9609-c35f-4228-a504-2ad6a504ba2f	\N	{"id": "7e5f9609-c35f-4228-a504-2ad6a504ba2f", "role": "AREA_MANAGER", "email": "aa@asd.com", "fullName": "aaatest"}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-11 20:24:19.673
890c71c8-c1f1-402b-9944-261c019c463e	CREATE	task	1	null	{"type": "Task", "task_id": "1", "body_preview": "adadasdasdasdasdasdas", "execution_date": "2025-12-12T00:00:00.000Z", "recipients_count": 12}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	\N	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:145.0) Gecko/20100101 Firefox/145.0	2025-12-12 06:28:28.855
80b7d0a1-77c3-43cc-834f-783eb749fc93	CREATE	task	2	null	{"type": "Task", "task_id": "2", "body_preview": "ads as dasd as das da sd", "execution_date": "2025-12-12T00:00:00.000Z", "recipients_count": 16}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	\N	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:145.0) Gecko/20100101 Firefox/145.0	2025-12-12 06:39:50.773
322506a4-d81d-4387-8248-be38283f0a53	CREATE	task	3	null	{"type": "Task", "task_id": "3", "body_preview": "sdasd ads asd as dsa", "execution_date": "2025-12-12T00:00:00.000Z", "recipients_count": 1}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	\N	\N	\N	::ffff:127.0.0.1	Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:145.0) Gecko/20100101 Firefox/145.0	2025-12-12 06:57:46.274
b3167c10-7d24-493a-8759-85e9cea547fc	CREATE_ACTIVIST_COORDINATOR_QUICK	ActivistCoordinator	669ac817-8457-4fde-ab00-03a69030b240	\N	{"email": "te@te.com", "title": "Activist Coordinator", "cityId": "4e68901a-b437-41f3-881b-23fb82f3c65c", "userId": "a0c76ab0-6b9b-4ad7-92f2-477d8835bc77", "fullName": "מפקח קריית מוצקין", "activistCoordinatorId": "669ac817-8457-4fde-ab00-03a69030b240"}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-13 13:02:07.466
f89093a4-0f9a-46a2-9cff-988f3840829f	CREATE_ACTIVIST_COORDINATOR_QUICK	ActivistCoordinator	2b8950db-fdf9-45fc-9d44-0090981a38fb	\N	{"email": "123@a.com", "title": "Activist Coordinator", "cityId": "f986a13b-90c3-4148-bef9-66b54427a69d", "userId": "79bd6bde-631e-484a-b4bd-466b9d711894", "fullName": "מפקח שדרות 1", "activistCoordinatorId": "2b8950db-fdf9-45fc-9d44-0090981a38fb"}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-13 13:08:34.73
14ae8cbc-bf91-4a8a-b0d6-0929bd8776cb	CREATE_ACTIVIST_COORDINATOR_QUICK	ActivistCoordinator	48347008-02ac-41e5-a70b-998e19ca808b	\N	{"email": "asd@asd.com", "title": "Activist Coordinator", "cityId": "38c0b193-0556-4299-a2f5-eb3997897eff", "userId": "135af055-e4b4-403c-978c-bafa792ef190", "fullName": "מפקח מעלות", "activistCoordinatorId": "48347008-02ac-41e5-a70b-998e19ca808b"}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-13 13:10:29.316
dac504c3-2e65-479d-a1aa-b89ef78874d6	CREATE_NEIGHBORHOOD	Site	27cd279d-7c60-4d92-95e3-91d2ac329cc5	\N	{"id": "27cd279d-7c60-4d92-95e3-91d2ac329cc5", "city": null, "name": "aaa", "cityId": "38c0b193-0556-4299-a2f5-eb3997897eff", "isActive": true, "supervisorName": "מפקח מעלות", "activistCoordinatorId": "48347008-02ac-41e5-a70b-998e19ca808b"}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-13 13:10:34.241
9bfd58e5-3367-4f50-937f-f776cb01fd76	CREATE_ACTIVIST_COORDINATOR_QUICK	ActivistCoordinator	eca4f34e-2060-4a5e-a176-b6967ac25812	\N	{"email": "qq@qq.com", "title": "Activist Coordinator", "cityId": "eeefb3ae-a353-4023-adb4-5177c07b06a1", "userId": "654dbd18-b8fd-4b75-962b-dc7bd016f929", "fullName": "testTiratCarmel", "activistCoordinatorId": "eca4f34e-2060-4a5e-a176-b6967ac25812"}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-13 13:11:17.319
f562bf3f-f6b8-4e36-8f07-437c802816a4	CREATE_NEIGHBORHOOD	Site	774da690-0c19-4f78-826a-ba8b26029bdd	\N	{"id": "774da690-0c19-4f78-826a-ba8b26029bdd", "city": null, "name": "שכונה בדיקה", "cityId": "eeefb3ae-a353-4023-adb4-5177c07b06a1", "isActive": true, "supervisorName": "testTiratCarmel", "activistCoordinatorId": "eca4f34e-2060-4a5e-a176-b6967ac25812"}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-13 13:43:16.63
ddb36097-9117-4340-bb66-1308f43bef84	CREATE_WORKER	Worker	6ed2e167-17f9-415f-a6a8-b507ab92e1ef	\N	{"id": "6ed2e167-17f9-415f-a6a8-b507ab92e1ef", "fullName": "פעיל 1", "isActive": true, "position": null, "neighborhoodId": "774da690-0c19-4f78-826a-ba8b26029bdd", "activistCoordinatorId": "eca4f34e-2060-4a5e-a176-b6967ac25812"}	654dbd18-b8fd-4b75-962b-dc7bd016f929	qq@qq.com	ACTIVIST_COORDINATOR	\N	\N	\N	2025-12-13 13:43:50.31
50fc1677-f305-4c0e-80d2-ca0cc9f97784	CREATE_WORKER	Worker	3f3366ce-e6ea-440b-a3a0-e128e8ddb8b4	\N	{"id": "3f3366ce-e6ea-440b-a3a0-e128e8ddb8b4", "fullName": "פעיל 2", "isActive": true, "position": null, "neighborhoodId": "774da690-0c19-4f78-826a-ba8b26029bdd", "activistCoordinatorId": "eca4f34e-2060-4a5e-a176-b6967ac25812"}	654dbd18-b8fd-4b75-962b-dc7bd016f929	qq@qq.com	ACTIVIST_COORDINATOR	\N	\N	\N	2025-12-13 13:44:25.366
b0abe9f9-3110-4095-aab6-51403eeaa3c3	CREATE_WORKER	Worker	c9b47830-1109-40d8-a0ae-9f57c2b5191e	\N	{"id": "c9b47830-1109-40d8-a0ae-9f57c2b5191e", "fullName": "פעיל 3 ", "isActive": true, "position": null, "neighborhoodId": "774da690-0c19-4f78-826a-ba8b26029bdd", "activistCoordinatorId": "eca4f34e-2060-4a5e-a176-b6967ac25812"}	654dbd18-b8fd-4b75-962b-dc7bd016f929	qq@qq.com	ACTIVIST_COORDINATOR	\N	\N	\N	2025-12-13 13:48:49.699
dd4b9adf-f8e7-4a42-b2b9-adad85fec2e7	UPDATE_WORKER	Worker	3f3366ce-e6ea-440b-a3a0-e128e8ddb8b4	{"fullName": "פעיל 2", "isActive": true, "position": null, "neighborhoodId": "774da690-0c19-4f78-826a-ba8b26029bdd"}	{"fullName": "פעיל 222", "isActive": true, "position": null, "neighborhoodId": "774da690-0c19-4f78-826a-ba8b26029bdd"}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-13 14:43:12.083
41fae012-1ea0-4c6c-a904-9684cef0f45c	CREATE_NEIGHBORHOOD	Site	bb04b456-c82a-4bcf-9ce4-6d58957f6f90	\N	{"id": "bb04b456-c82a-4bcf-9ce4-6d58957f6f90", "city": null, "name": "טסט", "cityId": "ff50ceaf-2bd7-4514-841c-d459b7ecc8d4", "isActive": true, "supervisorName": "יעל כהן", "activistCoordinatorId": "406a20a6-f5b6-4926-815a-33337b9c7072"}	d90d78df-f381-497d-b6b5-134aca0291f0	david.levi@telaviv.test	CITY_COORDINATOR	\N	\N	\N	2025-12-14 20:08:55.343
f46cb7c5-7ecc-4116-a966-ccbdc4db2deb	CREATE_WORKER	Worker	c84ca4fb-8ec4-43a7-acb6-6bcb2d90f156	\N	{"id": "c84ca4fb-8ec4-43a7-acb6-6bcb2d90f156", "fullName": "test", "isActive": true, "position": null, "neighborhoodId": "a0d68e02-fb83-4191-b66c-29b9c6172147", "activistCoordinatorId": "ed7ad7ac-4437-4c24-9aed-39a78fe44df2"}	d90d78df-f381-497d-b6b5-134aca0291f0	david.levi@telaviv.test	CITY_COORDINATOR	\N	\N	\N	2025-12-14 20:26:32.857
444d3f97-db4c-420c-9754-4b37dafa9920	CREATE_CORPORATION	Corporation	9c2b4b7f-777e-4792-822f-29b46d231818	\N	{"id": "9c2b4b7f-777e-4792-822f-29b46d231818", "code": "zyby-shl-yr", "name": "זיבי של עיר", "isActive": true}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-14 21:18:20.572
5f9c3c2e-e2dd-42f3-bbc6-320d094b8d7b	UPDATE_CORPORATION	Corporation	9c2b4b7f-777e-4792-822f-29b46d231818	{"code": "zyby-shl-yr", "name": "זיבי של עיר", "isActive": true, "description": "", "areaManagerId": "bf640c57-6b77-48e7-80f6-b476dcec6e65"}	{"code": "zyby-shl-yr", "name": "זיבי של עיר", "isActive": true, "description": "", "areaManagerId": "58da90d5-df1c-4556-b9b7-594918746423"}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-14 21:18:39.256
4c77ac5c-b5d1-4ce5-b936-1cab307ff07f	DELETE_ALL_USERS_EXCEPT_SYSTEM_ADMIN	User	bulk	{"deletedEmails": ["manager@center-district.prod", "manager@haifa-district.prod", "manager@jerusalem-district.prod", "manager@north-district.prod", "manager@south-district.prod", "manager@telaviv-district.prod"], "deletedUserIds": ["fd55cdbf-2e73-4207-8539-b8754bbb10e3", "08626a70-124e-4546-b53b-7d7567fa09f1", "3bfc8832-fce9-4f11-8669-ca5d4f4d31ba", "d4082cf1-427b-4890-a1ae-3667372305a9", "f3f77a45-029b-42c3-89e1-02da508a766d", "079c824d-fc89-4c03-81af-e213bf0b53d9"]}	{"keptEmails": ["admin@election.test"], "keptUserIds": ["2788df2d-ef2e-44c4-8ade-79710ff0ae42"]}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-14 21:20:59.503
6caf33df-770c-4f1c-b8ea-413f2c285402	CLEANUP_TO_MINIMAL_STATE	System	bulk	{"areas": 6, "tasks": 0, "users": 7, "cities": 83, "activists": 0, "auditLogs": 31, "attendance": 0, "userTokens": 0, "invitations": 0, "neighborhoods": 24, "taskAssignments": 0, "cityCoordinators": 0, "pushSubscriptions": 0, "activistCoordinators": 0, "coordinatorNeighborhoods": 0}	{"tasks": 0, "users": 0, "activists": 0, "userTokens": 0, "invitations": 0, "neighborhoods": 24, "taskAssignments": 0, "cityCoordinators": 0, "attendanceRecords": 0, "pushSubscriptions": 0, "activistCoordinators": 0, "coordinatorNeighborhoods": 0}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-14 21:26:29.768
133991a2-85b0-45e0-ba5b-4fc4753b7a81	DELETE_ALL_USERS_EXCEPT_SYSTEM_ADMIN	User	bulk	{"deletedUserIds": ["73dc1cc6-854f-4302-88ea-fa3ebee31fe1", "97264fd3-00ad-4b9a-847a-9d741bf0f75d", "f3d5722f-a942-45ae-9d11-a2e714053d15", "d7a726dd-2f88-44f7-bd4c-d9bc3036e6ba", "815596b2-1511-4f84-a42f-03e9b8c9e10d", "cbf5a26b-7f90-439b-baf9-e4eaad01193d"]}	{"keptUserIds": ["2788df2d-ef2e-44c4-8ade-79710ff0ae42"]}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-14 21:27:24.12
a4dd29e9-c1b7-4aef-b79f-69a5c54c7a10	CREATE_USER	User	3f612bc1-1790-403b-9955-c442123bffcb	\N	{"id": "3f612bc1-1790-403b-9955-c442123bffcb", "role": "AREA_MANAGER", "email": "merkaz@gmail.com", "fullName": "מנהל אזור מרכז"}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-14 21:34:19.029
c340c602-0b07-4b05-bd30-2ad970652702	UPDATE_CORPORATION	Corporation	59a04c9f-d087-4f14-bcac-ab8ac9e64824	{"code": "umm-al-fahm", "name": "אום אל-פחם", "isActive": true, "description": "עיר אום אל-פחם - אזור דרום", "areaManagerId": null}	{"code": "umm-al-fahm", "name": "אום אל-פחם", "isActive": true, "description": "עיר אום אל-פחם - אזור דרום22", "areaManagerId": null}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-14 21:35:11.096
f69a5f71-de2c-4f28-82a1-b025cb51550d	DELETE_ALL_USERS_EXCEPT_SYSTEM_ADMIN	User	bulk	{"deletedEmails": ["manager@center-district.prod", "manager@haifa-district.prod", "manager@jerusalem-district.prod", "manager@north-district.prod", "manager@south-district.prod", "manager@telaviv-district.prod", "merkaz@gmail.com"], "deletedUserIds": ["a5ff56b1-29ca-41c8-b1b4-4ba4de8859ed", "561b7c88-3812-4a49-b955-1b6bbf016178", "8887b51a-8b81-40d5-8744-d98a267da208", "20c3acf2-33e9-4cea-8d8e-6411be8559aa", "b4e70a71-95ec-4871-ae3c-60ab3979d21d", "74aa266b-7667-4a07-abbc-9fce6d4f0362", "3f612bc1-1790-403b-9955-c442123bffcb"]}	{"keptEmails": ["admin@election.test"], "keptUserIds": ["2788df2d-ef2e-44c4-8ade-79710ff0ae42"]}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-14 21:37:14.03
ca79ee6e-3f1a-42b2-b017-2f5b53bd1678	CREATE_USER	User	b5ea00aa-2eb6-4e07-98fa-0738c69f2cbb	\N	{"id": "b5ea00aa-2eb6-4e07-98fa-0738c69f2cbb", "role": "AREA_MANAGER", "email": "cafon@gmail.com", "fullName": "מנהל נדיר צפון"}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-14 21:46:31.306
a521576e-452b-4545-954e-824c38300c30	UPDATE_AREA_MANAGER	AreaManager	042c022e-f009-4bbc-9d5f-80dd35b926c0	{"userId": "b5ea00aa-2eb6-4e07-98fa-0738c69f2cbb", "isActive": true, "userEmail": "cafon@gmail.com", "regionCode": "NORTH", "regionName": "מחוז הצפון"}	{"userId": "b5ea00aa-2eb6-4e07-98fa-0738c69f2cbb", "isActive": true, "userEmail": "cafon@gmail.com", "regionCode": "NORTH", "regionName": "מחוז הצפון"}	2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	SUPERADMIN	\N	\N	\N	2025-12-14 21:54:57.596
17230d33-d0ae-49fc-a1cf-b943d31b9703	UPDATE_CORPORATION	Corporation	9c66aa23-3026-4cee-891b-097d945b13a4	{"code": "beit-shean", "name": "בית שאן", "isActive": true, "description": "עיר בית שאן - אזור צפון", "areaManagerId": "042c022e-f009-4bbc-9d5f-80dd35b926c0"}	{"code": "beit-shean", "name": "בית שאן 2", "isActive": true, "description": "עיר בית שאן - אזור צפון", "areaManagerId": "042c022e-f009-4bbc-9d5f-80dd35b926c0"}	b5ea00aa-2eb6-4e07-98fa-0738c69f2cbb	cafon@gmail.com	AREA_MANAGER	\N	\N	\N	2025-12-14 22:07:04.461
d6d57d77-80fc-46bd-a3f7-ecc514a74fb2	UPDATE_CORPORATION	Corporation	9c66aa23-3026-4cee-891b-097d945b13a4	{"code": "beit-shean", "name": "בית שאן 2", "isActive": true, "description": "עיר בית שאן - אזור צפון", "areaManagerId": "042c022e-f009-4bbc-9d5f-80dd35b926c0"}	{"code": "beit-shean", "name": "בית שאן", "isActive": true, "description": "עיר בית שאן - אזור צפון", "areaManagerId": "042c022e-f009-4bbc-9d5f-80dd35b926c0"}	b5ea00aa-2eb6-4e07-98fa-0738c69f2cbb	cafon@gmail.com	AREA_MANAGER	\N	\N	\N	2025-12-14 22:07:16.191
bdab1239-01ad-41c4-9e41-f870cc740b35	CREATE_ACTIVIST_COORDINATOR_QUICK	ActivistCoordinator	f7ad2c36-3032-450d-b720-5bc11338e2bd	\N	{"email": "shaf@gmail.com", "title": "Activist Coordinator", "cityId": "173de3d7-595b-45a4-b1e7-8587a214bf8d", "userId": "f167e928-22c1-49ea-a79b-a84d88e79470", "fullName": "מפקח של שפרעם", "activistCoordinatorId": "f7ad2c36-3032-450d-b720-5bc11338e2bd"}	b5ea00aa-2eb6-4e07-98fa-0738c69f2cbb	cafon@gmail.com	AREA_MANAGER	\N	\N	\N	2025-12-14 22:12:51.93
7703ce24-7f1d-45b0-8f62-023140941302	CREATE_NEIGHBORHOOD	Site	ff5ed4e2-12af-450b-b977-b3f6270bcb21	\N	{"id": "ff5ed4e2-12af-450b-b977-b3f6270bcb21", "city": null, "name": "שכונה פסיכית", "cityId": "173de3d7-595b-45a4-b1e7-8587a214bf8d", "isActive": true, "supervisorName": "מפקח של שפרעם", "activistCoordinatorId": "f7ad2c36-3032-450d-b720-5bc11338e2bd"}	b5ea00aa-2eb6-4e07-98fa-0738c69f2cbb	cafon@gmail.com	AREA_MANAGER	\N	\N	\N	2025-12-14 22:14:21.266
5fb9b5d5-312f-4d58-a0ff-620a4cdd00ef	CREATE_WORKER	Worker	ccb22caf-cece-435e-ba07-de0778081225	\N	{"id": "ccb22caf-cece-435e-ba07-de0778081225", "fullName": "פעיל דביל", "isActive": true, "position": null, "neighborhoodId": "ff5ed4e2-12af-450b-b977-b3f6270bcb21", "activistCoordinatorId": "f7ad2c36-3032-450d-b720-5bc11338e2bd"}	f167e928-22c1-49ea-a79b-a84d88e79470	shaf@gmail.com	ACTIVIST_COORDINATOR	\N	\N	\N	2025-12-14 22:22:21.359
e5d873b1-e5b1-464d-94b8-8e6d129864a6	CREATE_WORKER	Worker	5268abdf-16a3-4654-b703-7997768dea27	\N	{"id": "5268abdf-16a3-4654-b703-7997768dea27", "fullName": "פעיל מספר 2", "isActive": true, "position": null, "neighborhoodId": "ff5ed4e2-12af-450b-b977-b3f6270bcb21", "activistCoordinatorId": "f7ad2c36-3032-450d-b720-5bc11338e2bd"}	f167e928-22c1-49ea-a79b-a84d88e79470	shaf@gmail.com	ACTIVIST_COORDINATOR	\N	\N	\N	2025-12-14 22:23:53.74
6e96ae26-0c96-456d-842e-56b09cfe55d6	CREATE_WORKER	Worker	0db5fdfa-706f-4b83-ba9a-e240a235e2cc	\N	{"id": "0db5fdfa-706f-4b83-ba9a-e240a235e2cc", "fullName": "פעיל מספר 3", "isActive": true, "position": null, "neighborhoodId": "ff5ed4e2-12af-450b-b977-b3f6270bcb21", "activistCoordinatorId": "f7ad2c36-3032-450d-b720-5bc11338e2bd"}	f167e928-22c1-49ea-a79b-a84d88e79470	shaf@gmail.com	ACTIVIST_COORDINATOR	\N	\N	\N	2025-12-14 22:30:23.722
7e978c39-99a6-4169-b9af-ea86b048753e	CREATE_WORKER	Worker	c85bf998-aa96-4265-91a5-281544759d0b	\N	{"id": "c85bf998-aa96-4265-91a5-281544759d0b", "fullName": "פעיל 4", "isActive": true, "position": "מזדבל", "neighborhoodId": "ff5ed4e2-12af-450b-b977-b3f6270bcb21", "activistCoordinatorId": "f7ad2c36-3032-450d-b720-5bc11338e2bd"}	f167e928-22c1-49ea-a79b-a84d88e79470	shaf@gmail.com	ACTIVIST_COORDINATOR	\N	\N	\N	2025-12-14 22:35:12.415
bd52c29d-9752-4216-a6a9-c963a810eb7e	UPDATE_WORKER	Worker	c85bf998-aa96-4265-91a5-281544759d0b	{"fullName": "פעיל 4", "isActive": true, "position": "מזדבל", "neighborhoodId": "ff5ed4e2-12af-450b-b977-b3f6270bcb21"}	{"fullName": "פעיל 4", "isActive": true, "position": "מזדבל", "neighborhoodId": "ff5ed4e2-12af-450b-b977-b3f6270bcb21"}	f167e928-22c1-49ea-a79b-a84d88e79470	shaf@gmail.com	ACTIVIST_COORDINATOR	\N	\N	\N	2025-12-14 22:43:39.205
37301e59-5455-4807-bd6b-93ef5b137e66	CREATE_WORKER	Worker	b5faf0d1-8c92-4192-9ec7-fd67ccad32db	\N	{"id": "b5faf0d1-8c92-4192-9ec7-fd67ccad32db", "fullName": "debil 1", "isActive": true, "position": null, "neighborhoodId": "ff5ed4e2-12af-450b-b977-b3f6270bcb21", "activistCoordinatorId": "f7ad2c36-3032-450d-b720-5bc11338e2bd"}	f167e928-22c1-49ea-a79b-a84d88e79470	shaf@gmail.com	ACTIVIST_COORDINATOR	\N	\N	\N	2025-12-14 22:57:35.459
\.


--
-- Data for Name: cities; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.cities (id, name, code, description, logo_url, area_manager_id, is_active, settings, metadata, created_at, updated_at) FROM stdin;
9c66aa23-3026-4cee-891b-097d945b13a4	בית שאן	beit-shean	עיר בית שאן - אזור צפון	\N	042c022e-f009-4bbc-9d5f-80dd35b926c0	t	{}	\N	2025-12-10 18:31:58.966	2025-12-14 22:07:16.186
d7d1bb3a-5c1e-4ff3-a68e-2b9b59be7de1	טמרה	tamra	עיר טמרה - אזור צפון	\N	042c022e-f009-4bbc-9d5f-80dd35b926c0	t	{}	\N	2025-12-10 18:31:58.984	2025-12-14 22:03:20.536
9c2b4b7f-777e-4792-822f-29b46d231818	זיבי של עיר	zyby-shl-yr		\N	ea2b9287-b1bc-4461-b8db-14e1d3bc7dd6	t	{}	\N	2025-12-14 21:18:20.561	2025-12-14 22:03:20.587
37c57577-6e61-4e63-84f1-417af2f69c8d	כרמיאל	karmiel	עיר כרמיאל - אזור צפון	\N	042c022e-f009-4bbc-9d5f-80dd35b926c0	t	{}	\N	2025-12-10 18:31:58.993	2025-12-14 22:03:20.529
ff9c1f17-fa0a-4678-ab4c-e89b0fbb75cd	אור יהודה	or-yehuda	עיר אור יהודה - אזור מרכז	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:58.955	2025-12-14 22:03:20.56
5d0a4904-9cce-4256-b2fd-468dc880cbc5	יבנה	yavne	עיר יבנה - אזור מרכז	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:58.985	2025-12-14 22:03:20.568
bccf1579-7004-4bfc-9b86-38928530f582	ירושלים	jerusalem	עיר ירושלים - אזור אזור ירושלים	\N	24fe2588-1cce-4c48-a387-a01a47d7564f	t	{}	\N	2025-12-10 18:31:58.988	2025-12-14 22:03:20.574
1daf85ce-76b7-4e64-8205-ef51ccec15d3	אשדוד	ashdod	עיר אשדוד - אזור דרום	\N	ea2b9287-b1bc-4461-b8db-14e1d3bc7dd6	t	{}	\N	2025-12-10 18:31:58.96	2025-12-14 22:03:20.582
4c955c18-c3f8-4c7b-83e7-389e7fecef94	באר יעקב	beer-yaakov	עיר באר יעקב - אזור מרכז	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:58.964	2025-12-14 22:03:20.567
8a3353bc-7a04-49b6-8a6f-fc253573dc2d	קריית שמונה	kiryat-shmona	עיר קריית שמונה - אזור צפון	\N	042c022e-f009-4bbc-9d5f-80dd35b926c0	t	{}	\N	2025-12-10 18:31:59.018	2025-12-14 22:03:20.519
8796de84-9d48-47a6-8826-6a92b8be662a	צפת	tzfat	עיר צפת - אזור צפון	\N	042c022e-f009-4bbc-9d5f-80dd35b926c0	t	{}	\N	2025-12-10 18:31:59.01	2025-12-14 22:03:20.524
7f6814da-3958-43f6-9ce7-a80dc5f1a72a	נהריה	nahariya	עיר נהריה - אזור צפון	\N	042c022e-f009-4bbc-9d5f-80dd35b926c0	t	{}	\N	2025-12-10 18:31:58.999	2025-12-14 22:03:20.527
c517cce4-b868-4c8a-9eaa-7c9ba812e29c	עכו	acre	עיר עכו - אזור צפון	\N	042c022e-f009-4bbc-9d5f-80dd35b926c0	t	{}	\N	2025-12-10 18:31:59.006	2025-12-14 22:03:20.528
9e68a6f4-9f47-4874-ab8b-dd9815fa7b22	עפולה	afula	עיר עפולה - אזור צפון	\N	042c022e-f009-4bbc-9d5f-80dd35b926c0	t	{}	\N	2025-12-10 18:31:59.007	2025-12-14 22:03:20.532
c42b5f85-6a27-4ff6-99b1-7d41c2f8904e	טבריה	tiberias	עיר טבריה - אזור צפון	\N	042c022e-f009-4bbc-9d5f-80dd35b926c0	t	{}	\N	2025-12-10 18:31:58.981	2025-12-14 22:03:20.533
07e7d2f2-b862-447c-b114-8901a951bb67	מגדל העמק	migdal-haemek	עיר מגדל העמק - אזור צפון	\N	042c022e-f009-4bbc-9d5f-80dd35b926c0	t	{}	\N	2025-12-10 18:31:58.994	2025-12-14 22:03:20.534
8c582355-126d-4ac0-92e3-ea215537930e	כפר קרע	kafr-qara	עיר כפר קרע - אזור מרכז	\N	042c022e-f009-4bbc-9d5f-80dd35b926c0	t	{}	\N	2025-12-10 18:31:58.992	2025-12-14 22:03:20.54
abacff1e-72b7-4df1-bed7-b15ef1bc4579	מע'אר	majd-al-krum	עיר מע'אר - אזור צפון	\N	042c022e-f009-4bbc-9d5f-80dd35b926c0	t	{}	\N	2025-12-10 18:31:58.997	2025-12-14 22:03:20.54
194d5e7b-8b91-46b8-b8e5-3acb37d6e37a	חיפה	haifa	עיר חיפה - אזור צפון	\N	8990359e-cc48-45a1-8950-eb07274d5b02	t	{}	\N	2025-12-10 18:31:58.979	2025-12-14 22:03:20.541
b36abf30-0105-4075-8976-5901fad257ad	חדרה	hadera	עיר חדרה - אזור מרכז	\N	8990359e-cc48-45a1-8950-eb07274d5b02	t	{}	\N	2025-12-10 18:31:58.975	2025-12-14 22:03:20.547
7056fe58-67a9-4e05-814f-3090c0efb1b5	אור עקיבא	or-akiva	עיר אור עקיבא - אזור מרכז	\N	8990359e-cc48-45a1-8950-eb07274d5b02	t	{}	\N	2025-12-10 18:31:58.956	2025-12-14 22:03:20.548
2bbf36d4-e935-46ed-9fbc-23273213815a	כפר סבא	kfar-saba	עיר כפר סבא - אזור מרכז	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:58.99	2025-12-14 22:03:20.55
77b5a6d8-6b61-46e2-b722-f7afee2809b9	הוד השרון	hod-hasharon	עיר הוד השרון - אזור מרכז	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:58.973	2025-12-14 22:03:20.551
b76fd9b3-c665-4c8b-8000-f3ea8cc94b5b	רמת השרון	ramat-hasharon	עיר רמת השרון - אזור מרכז	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:59.024	2025-12-14 22:03:20.552
b1008c2b-d889-4b05-8e92-1cfba9b332f1	הרצליה	herzliya	עיר הרצליה - אזור מרכז	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:58.974	2025-12-14 22:03:20.552
d9946084-9c5d-448e-af94-aa19cfd3e6cb	כפר יונה	kfar-yona	עיר כפר יונה - אזור מרכז	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:58.989	2025-12-14 22:03:20.553
b960989c-5f4e-4dd6-9636-1d4eb73d8a9d	חריש	harish	עיר חריש - אזור מרכז	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:58.98	2025-12-14 22:03:20.554
5ba2e87d-8583-42fd-b3e4-acb2acab5926	יהוד-מונוסון	yehud-monosson	עיר יהוד-מונוסון - אזור מרכז	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:58.986	2025-12-14 22:03:20.556
382b73c3-c257-4463-ab91-95fc615d0231	טייבה	tayibe	עיר טייבה - אזור צפון	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:58.982	2025-12-14 22:03:20.557
0b7094dd-66a6-45e3-b41c-2fb077675c55	טירה	tira	עיר טירה - אזור צפון	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:58.982	2025-12-14 22:03:20.558
a3a77309-cab0-429a-b942-45aa6cc48744	כפר קאסם	kafr-qasim	עיר כפר קאסם - אזור מרכז	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:58.991	2025-12-14 22:03:20.559
3f6fb549-eb54-4843-b95a-7e40f8efede5	גבעת שמואל	givat-shmuel	עיר גבעת שמואל - אזור מרכז	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:58.97	2025-12-14 22:03:20.561
654d3561-d749-44b2-ae45-0afe9b1f9f1f	אלעד	elad	עיר אלעד - אזור מרכז	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:58.958	2025-12-14 22:03:20.562
1902b02f-f48e-4256-bd6f-4038a6f16eed	לוד	lod	עיר לוד - אזור מרכז	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:58.993	2025-12-14 22:03:20.564
59a04c9f-d087-4f14-bcac-ab8ac9e64824	אום אל-פחם	umm-al-fahm	עיר אום אל-פחם - אזור דרום22	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:58.951	2025-12-14 22:03:20.565
3c52829b-b73c-471f-a4f6-19bfadbd2e4b	בני ברק	bnei-brak	עיר בני ברק - אזור מרכז	\N	c862f895-9ec8-483a-af59-850d1f80dfe5	t	{}	\N	2025-12-10 18:31:58.968	2025-12-14 22:03:20.571
803ec205-63d8-4c31-8bd1-67123b38db96	חולון	holon	עיר חולון - אזור מרכז	\N	c862f895-9ec8-483a-af59-850d1f80dfe5	t	{}	\N	2025-12-10 18:31:58.975	2025-12-14 22:03:20.571
547f33cc-9dfa-4314-85a2-446a995c451d	גבעתיים	givatayim	עיר גבעתיים - אזור מרכז	\N	c862f895-9ec8-483a-af59-850d1f80dfe5	t	{}	\N	2025-12-10 18:31:58.971	2025-12-14 22:03:20.573
f12cc395-5d7b-4c8c-b290-b7468bf164a4	בית שמש	beit-shemesh	עיר בית שמש - אזור אזור ירושלים	\N	24fe2588-1cce-4c48-a387-a01a47d7564f	t	{}	\N	2025-12-10 18:31:58.966	2025-12-14 22:03:20.575
576fdf97-7ab6-466f-a2dd-b22540a55cc0	מעלה אדומים	maaleh-adumim	עיר מעלה אדומים - אזור מרכז	\N	24fe2588-1cce-4c48-a387-a01a47d7564f	t	{}	\N	2025-12-10 18:31:58.998	2025-12-14 22:03:20.576
7f9f851a-ae43-4bac-bb7e-ca66224bd9e5	מודיעין עילית	modiin-illit	עיר מודיעין עילית - אזור מרכז	\N	24fe2588-1cce-4c48-a387-a01a47d7564f	t	{}	\N	2025-12-10 18:31:58.996	2025-12-14 22:03:20.577
4f188e9e-bf83-452d-bcde-34a982abba4a	אריאל	ariel	עיר אריאל - אזור מרכז	\N	24fe2588-1cce-4c48-a387-a01a47d7564f	t	{}	\N	2025-12-10 18:31:58.959	2025-12-14 22:03:20.578
71523ed4-be1f-4b5a-bbb0-8dc8b312a4be	אשקלון	ashkelon	עיר אשקלון - אזור דרום	\N	ea2b9287-b1bc-4461-b8db-14e1d3bc7dd6	t	{}	\N	2025-12-10 18:31:58.962	2025-12-14 22:03:20.579
c013184b-64a1-4b57-aadb-e81808adf7c2	באר שבע	beer-sheva	עיר באר שבע - אזור דרום	\N	ea2b9287-b1bc-4461-b8db-14e1d3bc7dd6	t	{}	\N	2025-12-10 18:31:58.965	2025-12-14 22:03:20.582
5a1ba4fb-c59a-465b-b45f-95c300528e31	דימונה	dimona	עיר דימונה - אזור דרום	\N	ea2b9287-b1bc-4461-b8db-14e1d3bc7dd6	t	{}	\N	2025-12-10 18:31:58.972	2025-12-14 22:03:20.584
f97908cc-b899-48fc-b133-da3c6c96ef27	אילת	eilat	עיר אילת - אזור דרום	\N	ea2b9287-b1bc-4461-b8db-14e1d3bc7dd6	t	{}	\N	2025-12-10 18:31:58.957	2025-12-14 22:03:20.586
38c0b193-0556-4299-a2f5-eb3997897eff	מעלות-תרשיחא	maalot-tarshiha	עיר מעלות-תרשיחא - אזור צפון	\N	042c022e-f009-4bbc-9d5f-80dd35b926c0	t	{}	\N	2025-12-10 18:31:58.998	2025-12-14 22:03:20.525
4ce0ef56-f960-4eeb-ba88-323a4fa289fa	נצרת	nazareth	עיר נצרת - אזור צפון	\N	042c022e-f009-4bbc-9d5f-80dd35b926c0	t	{}	\N	2025-12-10 18:31:59.002	2025-12-14 22:03:20.53
0406d4b2-b209-4600-acbd-a4829f64c685	נוף הגליל	nof-hagalil	עיר נוף הגליל - אזור צפון	\N	042c022e-f009-4bbc-9d5f-80dd35b926c0	t	{}	\N	2025-12-10 18:31:59	2025-12-14 22:03:20.531
f211573a-4f04-4060-b1a7-8e482aadf4f3	יקנעם עילית	yokneam-illit	עיר יקנעם עילית - אזור צפון	\N	042c022e-f009-4bbc-9d5f-80dd35b926c0	t	{}	\N	2025-12-10 18:31:58.987	2025-12-14 22:03:20.536
83de1c23-af09-4c93-8cdd-e28f2c86a8ac	סח'נין	sakhnin	עיר סח'נין - אזור צפון	\N	042c022e-f009-4bbc-9d5f-80dd35b926c0	t	{}	\N	2025-12-10 18:31:59.006	2025-12-14 22:03:20.537
173de3d7-595b-45a4-b1e7-8587a214bf8d	שפרעם	shfaram	עיר שפרעם - אזור צפון	\N	042c022e-f009-4bbc-9d5f-80dd35b926c0	t	{}	\N	2025-12-10 18:31:59.027	2025-12-14 22:03:20.538
2cbdb6ce-3839-4bdb-a84d-8c5d5a963ebc	עראבה	arraba	עיר עראבה - אזור צפון	\N	042c022e-f009-4bbc-9d5f-80dd35b926c0	t	{}	\N	2025-12-10 18:31:59.008	2025-12-14 22:03:20.539
58ea43d3-ccec-44c7-8aae-dd72d6dd8dd6	קריית אתא	kiryat-ata	עיר קריית אתא - אזור צפון	\N	8990359e-cc48-45a1-8950-eb07274d5b02	t	{}	\N	2025-12-10 18:31:59.013	2025-12-14 22:03:20.542
cc0db220-fb0b-4c4f-a63c-4b9a3d99e6cd	קריית ביאליק	kiryat-bialik	עיר קריית ביאליק - אזור צפון	\N	8990359e-cc48-45a1-8950-eb07274d5b02	t	{}	\N	2025-12-10 18:31:59.014	2025-12-14 22:03:20.543
cabc5e74-d7a9-4893-8880-24feef004e31	קריית ים	kiryat-yam	עיר קריית ים - אזור צפון	\N	8990359e-cc48-45a1-8950-eb07274d5b02	t	{}	\N	2025-12-10 18:31:59.016	2025-12-14 22:03:20.544
4e68901a-b437-41f3-881b-23fb82f3c65c	קריית מוצקין	kiryat-motzkin	עיר קריית מוצקין - אזור צפון	\N	8990359e-cc48-45a1-8950-eb07274d5b02	t	{}	\N	2025-12-10 18:31:59.016	2025-12-14 22:03:20.545
4becef64-5975-4055-8828-360a51ae34a6	נשר	nesher	עיר נשר - אזור צפון	\N	8990359e-cc48-45a1-8950-eb07274d5b02	t	{}	\N	2025-12-10 18:31:59.003	2025-12-14 22:03:20.545
eeefb3ae-a353-4023-adb4-5177c07b06a1	טירת כרמל	tirat-carmel	עיר טירת כרמל - אזור צפון	\N	8990359e-cc48-45a1-8950-eb07274d5b02	t	{}	\N	2025-12-10 18:31:58.983	2025-12-14 22:03:20.546
e000f1bb-662a-4235-aea6-2c3e90feb7a4	נתניה	netanya	עיר נתניה - אזור מרכז	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:59.005	2025-12-14 22:03:20.549
f3822a90-072b-42fb-be20-45fd365b2c9a	רעננה	raanana	עיר רעננה - אזור מרכז	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:59.025	2025-12-14 22:03:20.549
d55f50f3-a0bc-4c0c-8301-da41b322cb51	פתח תקווה	petah-tikva	עיר פתח תקווה - אזור מרכז	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:59.009	2025-12-14 22:03:20.554
f0d8892c-9365-4a85-99f3-c4389df6a8b1	ראש העין	rosh-haayin	עיר ראש העין - אזור מרכז	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:59.019	2025-12-14 22:03:20.555
9e301d2e-f6a5-4b66-82a3-53213b1a5ee7	קלנסווה	qalansawe	עיר קלנסווה - אזור דרום	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:59.011	2025-12-14 22:03:20.557
468a6b98-5814-4c3f-a69e-c488653cb7c1	גני תקווה	ganei-tikva	עיר גני תקווה - אזור מרכז	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:58.972	2025-12-14 22:03:20.56
5627503e-d955-4724-8d70-eaa19646f9aa	קריית אונו	kiryat-ono	עיר קריית אונו - אזור מרכז	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:59.012	2025-12-14 22:03:20.562
90ebe49f-b1be-4ef6-8e84-99363c8abe23	רמלה	ramla	עיר רמלה - אזור מרכז	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:59.022	2025-12-14 22:03:20.563
05cfa524-2d17-4a08-b622-de775979a189	באקה אל-גרבייה	baqa-al-gharbiyye	עיר באקה אל-גרבייה - אזור מרכז	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:58.963	2025-12-14 22:03:20.564
885bcd88-4998-44d8-8654-737f08c0281c	רחובות	rehovot	עיר רחובות - אזור מרכז	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:59.021	2025-12-14 22:03:20.566
d9767695-d323-40d4-b93d-905db16cd9b5	נס ציונה	nes-ziona	עיר נס ציונה - אזור מרכז	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:59.001	2025-12-14 22:03:20.566
042a5f75-4455-440a-af78-2b355074493c	מודיעין-מכבים-רעות	modiin-maccabim-reut	עיר מודיעין-מכבים-רעות - אזור מרכז	\N	ae1479db-9557-4fb9-9b37-b2786abdbbea	t	{}	\N	2025-12-10 18:31:58.995	2025-12-14 22:03:20.568
ff50ceaf-2bd7-4514-841c-d459b7ecc8d4	תל אביב-יפו	TLV-YAFO	עיר תל אביב-יפו - אזור מרכז	\N	c862f895-9ec8-483a-af59-850d1f80dfe5	t	{}	\N	2025-12-10 15:42:45.401	2025-12-14 22:03:20.569
f0437968-2167-4983-bf5d-512e76131f58	רמת גן	RAMAT-GAN	עיר רמת גן - אזור מרכז	\N	c862f895-9ec8-483a-af59-850d1f80dfe5	t	{}	\N	2025-12-10 15:42:45.638	2025-12-14 22:03:20.57
f3324752-2c2c-4ccd-93b2-e7efa9ef7e55	בת ים	bat-yam	עיר בת ים - אזור מרכז	\N	c862f895-9ec8-483a-af59-850d1f80dfe5	t	{}	\N	2025-12-10 18:31:58.969	2025-12-14 22:03:20.572
b99bfd40-6312-4c2c-8e7a-8ef769a921c0	ראשון לציון	rishon-letzion	עיר ראשון לציון - אזור מרכז	\N	c862f895-9ec8-483a-af59-850d1f80dfe5	t	{}	\N	2025-12-10 18:31:59.02	2025-12-14 22:03:20.573
b624f2ed-a0ca-412f-af45-1dab8a0c43e8	ביתר עילית	beitar-illit	עיר ביתר עילית - אזור מרכז	\N	24fe2588-1cce-4c48-a387-a01a47d7564f	t	{}	\N	2025-12-10 18:31:58.967	2025-12-14 22:03:20.576
2586c788-eef4-442e-8460-9fda34b67dd9	קריית גת	kiryat-gat	עיר קריית גת - אזור דרום	\N	ea2b9287-b1bc-4461-b8db-14e1d3bc7dd6	t	{}	\N	2025-12-10 18:31:59.015	2025-12-14 22:03:20.579
72925aed-3386-43b5-9dd0-f6ad6243d844	קריית מלאכי	kiryat-malakhi	עיר קריית מלאכי - אזור דרום	\N	ea2b9287-b1bc-4461-b8db-14e1d3bc7dd6	t	{}	\N	2025-12-10 18:31:59.017	2025-12-14 22:03:20.58
f986a13b-90c3-4148-bef9-66b54427a69d	שדרות	sderot	עיר שדרות - אזור דרום	\N	ea2b9287-b1bc-4461-b8db-14e1d3bc7dd6	t	{}	\N	2025-12-10 18:31:59.026	2025-12-14 22:03:20.581
f7a9fcc5-8099-4c0f-aed4-79c2afb18390	אופקים	ofakim	עיר אופקים - אזור דרום	\N	ea2b9287-b1bc-4461-b8db-14e1d3bc7dd6	t	{}	\N	2025-12-10 18:31:58.953	2025-12-14 22:03:20.583
0ddfc9d7-d27b-48a5-8173-d8554741ee83	נתיבות	netivot	עיר נתיבות - אזור דרום	\N	ea2b9287-b1bc-4461-b8db-14e1d3bc7dd6	t	{}	\N	2025-12-10 18:31:59.004	2025-12-14 22:03:20.583
96df1319-2db7-4c75-88bb-b578eeaf3649	ערד	arad	עיר ערד - אזור דרום	\N	ea2b9287-b1bc-4461-b8db-14e1d3bc7dd6	t	{}	\N	2025-12-10 18:31:59.009	2025-12-14 22:03:20.585
d0bc7a34-becc-4ea2-aae5-bc6159418270	רהט	rahat	עיר רהט - אזור דרום	\N	ea2b9287-b1bc-4461-b8db-14e1d3bc7dd6	t	{}	\N	2025-12-10 18:31:59.02	2025-12-14 22:03:20.586
\.


--
-- Data for Name: city_coordinators; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.city_coordinators (id, city_id, user_id, title, is_active, metadata, created_at, updated_at) FROM stdin;
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
ff5ed4e2-12af-450b-b977-b3f6270bcb21	שכונה פסיכית	\N	\N	Israel	\N	\N	\N	\N	t	\N	173de3d7-595b-45a4-b1e7-8587a214bf8d	2025-12-14 22:14:21.262	2025-12-14 22:14:21.262
d810ba65-0619-4b90-9c2c-662f1a24da02	לב העיר	לב העיר, תל אביב-יפו	תל אביב-יפו	ישראל	\N	\N	\N	\N	t	\N	ff50ceaf-2bd7-4514-841c-d459b7ecc8d4	2025-12-14 22:54:46.147	2025-12-14 22:54:46.147
86278482-da0f-44f4-8cde-5b3f37c36d1e	נווה צדק	נווה צדק, תל אביב-יפו	תל אביב-יפו	ישראל	\N	\N	\N	\N	t	\N	ff50ceaf-2bd7-4514-841c-d459b7ecc8d4	2025-12-14 22:54:46.155	2025-12-14 22:54:46.155
fc96417c-5a2f-45ba-af22-90cf04191df1	פלורנטין	פלורנטין, תל אביב-יפו	תל אביב-יפו	ישראל	\N	\N	\N	\N	t	\N	ff50ceaf-2bd7-4514-841c-d459b7ecc8d4	2025-12-14 22:54:46.157	2025-12-14 22:54:46.157
b49c755c-c07c-4473-87d8-aa10527ee3eb	יפו העתיקה	יפו העתיקה, תל אביב-יפו	תל אביב-יפו	ישראל	\N	\N	\N	\N	t	\N	ff50ceaf-2bd7-4514-841c-d459b7ecc8d4	2025-12-14 22:54:46.159	2025-12-14 22:54:46.159
a0c03c65-f9de-434d-ad21-de3c94792ad3	עג'מי	עג'מי, תל אביב-יפו	תל אביב-יפו	ישראל	\N	\N	\N	\N	t	\N	ff50ceaf-2bd7-4514-841c-d459b7ecc8d4	2025-12-14 22:54:46.162	2025-12-14 22:54:46.162
47391ba3-fbaa-439c-a7b9-b85b8388fbec	נווה שאנן	נווה שאנן, תל אביב-יפו	תל אביב-יפו	ישראל	\N	\N	\N	\N	t	\N	ff50ceaf-2bd7-4514-841c-d459b7ecc8d4	2025-12-14 22:54:46.163	2025-12-14 22:54:46.163
3967c869-93be-4365-a2d2-c53a9649ff69	צפון הישן	צפון הישן, תל אביב-יפו	תל אביב-יפו	ישראל	\N	\N	\N	\N	t	\N	ff50ceaf-2bd7-4514-841c-d459b7ecc8d4	2025-12-14 22:54:46.165	2025-12-14 22:54:46.165
f499559e-49c8-401b-ba81-394405904fa2	רמת אביב	רמת אביב, תל אביב-יפו	תל אביב-יפו	ישראל	\N	\N	\N	\N	t	\N	ff50ceaf-2bd7-4514-841c-d459b7ecc8d4	2025-12-14 22:54:46.166	2025-12-14 22:54:46.166
e75a02ee-f53b-4222-9da0-de2bc9c23154	רמת החייל	רמת החייל, תל אביב-יפו	תל אביב-יפו	ישראל	\N	\N	\N	\N	t	\N	ff50ceaf-2bd7-4514-841c-d459b7ecc8d4	2025-12-14 22:54:46.167	2025-12-14 22:54:46.167
f064fb90-a9c1-4578-8f37-2975ced0d40a	תל ברוך	תל ברוך, תל אביב-יפו	תל אביב-יפו	ישראל	\N	\N	\N	\N	t	\N	ff50ceaf-2bd7-4514-841c-d459b7ecc8d4	2025-12-14 22:54:46.168	2025-12-14 22:54:46.168
2b23f8c9-0158-4153-85a8-24390ca4ed6e	יד אליהו	יד אליהו, תל אביב-יפו	תל אביב-יפו	ישראל	\N	\N	\N	\N	t	\N	ff50ceaf-2bd7-4514-841c-d459b7ecc8d4	2025-12-14 22:54:46.169	2025-12-14 22:54:46.169
c657bd39-a615-4307-89dc-df3be0506a00	בבלי	בבלי, תל אביב-יפו	תל אביב-יפו	ישראל	\N	\N	\N	\N	t	\N	ff50ceaf-2bd7-4514-841c-d459b7ecc8d4	2025-12-14 22:54:46.17	2025-12-14 22:54:46.17
a22653cb-acf3-4f0d-9880-9bedd42b5e26	צהלון	צהלון, תל אביב-יפו	תל אביב-יפו	ישראל	\N	\N	\N	\N	t	\N	ff50ceaf-2bd7-4514-841c-d459b7ecc8d4	2025-12-14 22:54:46.171	2025-12-14 22:54:46.171
d6ba2ef9-7600-4a68-abbf-29762c5fafd8	שפירא	שפירא, תל אביב-יפו	תל אביב-יפו	ישראל	\N	\N	\N	\N	t	\N	ff50ceaf-2bd7-4514-841c-d459b7ecc8d4	2025-12-14 22:54:46.172	2025-12-14 22:54:46.172
39c15c51-7a87-4b87-b474-b7b4c8afb1ae	הקריה	הקריה, תל אביב-יפו	תל אביב-יפו	ישראל	\N	\N	\N	\N	t	\N	ff50ceaf-2bd7-4514-841c-d459b7ecc8d4	2025-12-14 22:54:46.172	2025-12-14 22:54:46.172
6f186451-ed59-479d-83c3-b2a0b44d0029	יפו ג'	יפו ג', תל אביב-יפו	תל אביב-יפו	ישראל	\N	\N	\N	\N	t	\N	ff50ceaf-2bd7-4514-841c-d459b7ecc8d4	2025-12-14 22:54:46.173	2025-12-14 22:54:46.173
038a8567-341c-462b-8796-649fb06776af	גבעת התמרים	גבעת התמרים, תל אביב-יפו	תל אביב-יפו	ישראל	\N	\N	\N	\N	t	\N	ff50ceaf-2bd7-4514-841c-d459b7ecc8d4	2025-12-14 22:54:46.174	2025-12-14 22:54:46.174
c722f191-a4d4-4913-a5ea-fb2d4c11eab7	גבעת עלייה	גבעת עלייה, תל אביב-יפו	תל אביב-יפו	ישראל	\N	\N	\N	\N	t	\N	ff50ceaf-2bd7-4514-841c-d459b7ecc8d4	2025-12-14 22:54:46.175	2025-12-14 22:54:46.175
4f7dcb48-7bb3-4194-80d3-d9c4733e6877	נמל תל אביב	נמל תל אביב, תל אביב-יפו	תל אביב-יפו	ישראל	\N	\N	\N	\N	t	\N	ff50ceaf-2bd7-4514-841c-d459b7ecc8d4	2025-12-14 22:54:46.175	2025-12-14 22:54:46.175
df42388e-6513-4409-886c-6f064e7caf15	הירקון	הירקון, תל אביב-יפו	תל אביב-יפו	ישראל	\N	\N	\N	\N	t	\N	ff50ceaf-2bd7-4514-841c-d459b7ecc8d4	2025-12-14 22:54:46.176	2025-12-14 22:54:46.176
d3817233-856d-44dc-8ffb-fb7d3d42a3a1	רוטשילד	רוטשילד, תל אביב-יפו	תל אביב-יפו	ישראל	\N	\N	\N	\N	t	\N	ff50ceaf-2bd7-4514-841c-d459b7ecc8d4	2025-12-14 22:54:46.177	2025-12-14 22:54:46.177
974e882a-3367-47e7-8c66-5f999b071ee4	דיזנגוף	דיזנגוף, תל אביב-יפו	תל אביב-יפו	ישראל	\N	\N	\N	\N	t	\N	ff50ceaf-2bd7-4514-841c-d459b7ecc8d4	2025-12-14 22:54:46.178	2025-12-14 22:54:46.178
1492d2ea-928e-4d34-a90a-7ace67a2bacb	שוק הכרמל	שוק הכרמל, תל אביב-יפו	תל אביב-יפו	ישראל	\N	\N	\N	\N	t	\N	ff50ceaf-2bd7-4514-841c-d459b7ecc8d4	2025-12-14 22:54:46.179	2025-12-14 22:54:46.179
bf85bed9-92ad-495b-a6f8-a255fc99b698	נחלת בנימין	נחלת בנימין, תל אביב-יפו	תל אביב-יפו	ישראל	\N	\N	\N	\N	t	\N	ff50ceaf-2bd7-4514-841c-d459b7ecc8d4	2025-12-14 22:54:46.18	2025-12-14 22:54:46.18
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
b5ea00aa-2eb6-4e07-98fa-0738c69f2cbb	cafon@gmail.com	מנהל נדיר צפון	0655765576	\N	$2a$12$q9RMQY4ClXsLF8fRUSICOOD7HiGwK9g1ZwIof.UVBQyMLoQ4ddtXW	AREA_MANAGER	t	f	2025-12-14 21:46:31.303	2025-12-14 21:55:35.829	2025-12-14 21:55:35.828
2788df2d-ef2e-44c4-8ade-79710ff0ae42	admin@election.test	מנהל מערכת	+972-50-000-0000	\N	$2a$10$AKbAb67Kyb8rYvX8f79hA.PYmNHbdm.sgRVZwkVXaBkGdpHocWnKu	SUPERADMIN	t	t	2025-12-10 15:42:45.322	2025-12-14 22:08:58.483	2025-12-14 22:08:58.483
9dc6b2e8-9bd2-47e3-b7eb-86dd3f6d933f	manager@jerusalem-district.prod	אבי הר-טוב	+972-54-200-0001	\N	$2a$10$lRE1nFQP39mH8Br3AHjf9O9UeRBeWcDBXsdyWLituKpKUY55mz976	AREA_MANAGER	t	f	2025-12-14 22:09:31.138	2025-12-14 22:09:31.138	\N
6881dc2b-52a6-47a0-a81f-6ca7ba249132	manager@north-district.prod	יעל גולן	+972-54-200-0002	\N	$2a$10$lRE1nFQP39mH8Br3AHjf9O9UeRBeWcDBXsdyWLituKpKUY55mz976	AREA_MANAGER	t	f	2025-12-14 22:09:31.15	2025-12-14 22:09:31.15	\N
1891fb96-4d0d-4b28-bd3b-7fb4d3fdefb2	manager@haifa-district.prod	מיכאל כרמל	+972-54-200-0003	\N	$2a$10$lRE1nFQP39mH8Br3AHjf9O9UeRBeWcDBXsdyWLituKpKUY55mz976	AREA_MANAGER	t	f	2025-12-14 22:09:31.159	2025-12-14 22:09:31.159	\N
29291b75-1e88-48b7-8b22-5f832d35413e	manager@center-district.prod	רונית שרון	+972-54-200-0004	\N	$2a$10$lRE1nFQP39mH8Br3AHjf9O9UeRBeWcDBXsdyWLituKpKUY55mz976	AREA_MANAGER	t	f	2025-12-14 22:09:31.162	2025-12-14 22:09:31.162	\N
fae5ade5-d4f3-4515-bd3f-b1d4b319a1c6	manager@telaviv-district.prod	שרה כהן	+972-54-200-0005	\N	$2a$10$lRE1nFQP39mH8Br3AHjf9O9UeRBeWcDBXsdyWLituKpKUY55mz976	AREA_MANAGER	t	f	2025-12-14 22:09:31.165	2025-12-14 22:09:31.165	\N
6c7c271b-09e2-4cad-9dfb-2f9389662567	manager@south-district.prod	תמר נגב	+972-54-200-0006	\N	$2a$10$lRE1nFQP39mH8Br3AHjf9O9UeRBeWcDBXsdyWLituKpKUY55mz976	AREA_MANAGER	t	f	2025-12-14 22:09:31.168	2025-12-14 22:09:31.168	\N
f167e928-22c1-49ea-a79b-a84d88e79470	shaf@gmail.com	מפקח של שפרעם	123123123	\N	$2a$12$fl8c1Q2dXiZUA/x.IV.w2.6.6GhMF6N5MISV5GQISIMBIa8LIucsW	ACTIVIST_COORDINATOR	t	f	2025-12-14 22:12:51.918	2025-12-14 22:13:49.866	2025-12-14 22:13:49.866
\.


--
-- Name: push_subscriptions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.push_subscriptions_id_seq', 1, false);


--
-- Name: task_assignments_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.task_assignments_id_seq', 29, true);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tasks_id_seq', 3, true);


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
-- Name: activists activists_neighborhood_id_city_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activists
    ADD CONSTRAINT activists_neighborhood_id_city_id_fkey FOREIGN KEY (neighborhood_id, city_id) REFERENCES public.neighborhoods(id, city_id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: area_managers area_managers_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.area_managers
    ADD CONSTRAINT area_managers_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL;


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

