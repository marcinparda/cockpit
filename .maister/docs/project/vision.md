# Project Vision

## Overview
Cockpit is a self-hosted personal agent platform that consolidates task management, personal finance, notes, CV, and AI-assisted workflows into a unified dashboard — deployed at home on a Raspberry Pi.

## Current State
- **Status**: Active development — existing apps being extended, infrastructure stable
- **Users**: Single-user (personal productivity platform)
- **Tech Stack**: FastAPI + PostgreSQL backend; React/Vue/Angular frontend on Nx; Docker on Raspberry Pi
- **Architecture**: Fullstack monorepo — clean layer separation, enforced module boundaries, type-safe API bridge

## Purpose
Cockpit exists to replace fragmented third-party tools with a self-hosted, tightly integrated platform. Instead of juggling separate apps for tasks (Vikunja), finance (Actual Budget), and notes, everything is accessible from one interface — owned, controlled, and extensible by the developer.

The AI agent layer (MCP server + OpenAI integration) enables natural language interaction with all integrated services, turning the platform into an active assistant rather than a passive dashboard.

## Goals (Active)
1. **Add features to existing apps** — Extend cockpit, CV, store, and agent apps with new capabilities
2. **Improve test coverage** — Write unit tests for backend services and frontend components; integrate coverage reporting in CI
3. **Improve observability** — LiteLLM proxy + Langfuse Cloud for full AI/LLM observability; structured logging (JSON) and error tracking for application layer
4. **Stabilize and maintain** — Keep the platform reliable; harden error handling; document environment setup

## Evolution
The project started as separate submodules and was recently consolidated into a unified monorepo. The monorepo structure brings shared type safety, unified CI/CD, and cleaner cross-app library sharing.

Next evolution: deeper AI agent capabilities, more integrated services, and a hardened production setup suitable for long-running unattended operation on Raspberry Pi.
