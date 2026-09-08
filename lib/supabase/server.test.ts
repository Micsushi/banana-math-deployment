import { afterEach, expect, it, vi } from "vitest"

import { createClient } from "./server"

const mocks = vi.hoisted(() => ({
  get: vi.fn(() => ({ value: "session-value" })),
  set: vi.fn(),
  createServerClient: vi.fn((_url, _key, options) => options)
}))

vi.mock("next/headers", () => ({
  cookies: async () => ({ get: mocks.get, set: mocks.set })
}))
vi.mock("@supabase/ssr", () => ({ createServerClient: mocks.createServerClient }))

afterEach(() => vi.unstubAllEnvs())

it("awaits the request cookie store before wiring Supabase auth cookies", async () => {
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.invalid")
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "test-only")
  vi.stubEnv("NEXT_PUBLIC_MOCK_DB", "false")
  vi.stubEnv("NEXT_PUBLIC_MOCK_AUTH", "false")

  const client = await createClient()
  expect(client.cookies.get("session")).toBe("session-value")
  client.cookies.set("session", "replacement", { httpOnly: true })
  expect(mocks.set).toHaveBeenCalledWith({
    name: "session",
    value: "replacement",
    httpOnly: true
  })
})
