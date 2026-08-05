import { Logger } from '@nestjs/common';
import { AuditLogService } from './audit-log.service';

describe('AuditLogService', () => {
  it('UT-018 logs a structured entry with adminId, action, targetId for each action name', () => {
    const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    const service = new AuditLogService();
    const actions = [
      'approve',
      'request-adjustment',
      'resolve',
      'allergen-approve',
      'allergen-reject',
      'boost-create',
    ] as const;

    actions.forEach((action, index) => {
      service.log({ adminId: 'admin-1', action, targetId: `target-${index}` });
    });

    expect(logSpy).toHaveBeenCalledTimes(actions.length);
    actions.forEach((action, index) => {
      const [entry] = logSpy.mock.calls[index] as [
        {
          adminId: string;
          action: string;
          targetId: string;
          timestamp: string;
        },
      ];
      expect(entry.adminId).toBe('admin-1');
      expect(entry.action).toBe(action);
      expect(entry.targetId).toBe(`target-${index}`);
      expect(typeof entry.timestamp).toBe('string');
    });

    logSpy.mockRestore();
  });
});
