import type { Session } from '@supabase/supabase-js';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

import type { UserProfile } from '@/module/auth/types';

import { profileService } from './profile-service';

const session = { access_token: 'access-token' } as Session;
const user = { id: 'user-1', name: 'Ana' } as UserProfile;

describe('ProfileService', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('bootstraps the profile with the session bearer token', async () => {
    const response = { missingName: false, user };
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      json: () => Promise.resolve(response), ok: true,
    } as Response);

    await expect(profileService.bootstrap(session)).resolves.toEqual(response);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/me/bootstrap', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer access-token',
        'Content-Type': 'application/json',
      },
      body: '{}',
    });
  });

  it('patches the supplied profile name', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      json: () => Promise.resolve(user), ok: true,
    } as Response);

    await expect(profileService.updateName(session, 'Ana')).resolves.toBe(user);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/me', expect.objectContaining({
      method: 'PATCH', body: JSON.stringify({ name: 'Ana' }),
    }));
  });

  it('fetches the current profile', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({
      json: () => Promise.resolve(user), ok: true,
    } as Response);
    await expect(profileService.getMe(session)).resolves.toBe(user);
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/me', expect.objectContaining({ method: 'GET' }));
  });

  it('deletes the current profile without parsing the empty response', async () => {
    const fetchMock = jest.spyOn(global, 'fetch').mockResolvedValue({ ok: true, status: 202 } as Response);
    await expect(profileService.deleteMe(session)).resolves.toBeUndefined();
    expect(fetchMock).toHaveBeenCalledWith('http://localhost:3000/me', expect.objectContaining({ method: 'DELETE' }));
  });

  it('rejects non-successful API responses', async () => {
    jest.spyOn(global, 'fetch').mockResolvedValue({ ok: false, status: 401 } as Response);
    await expect(profileService.bootstrap(session)).rejects.toThrow('status 401');
  });
});
