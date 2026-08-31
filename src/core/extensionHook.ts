import { DiagnosisResult, SorghumExtensionHook } from '../types';

/**
 * Extension Point / Plugin Interface Hook for Part 3 Future Enhancements
 * (e.g. Yield Estimation, Weather Advisories, Supply Chain Marketplace, Audio Guidance)
 */
export class SorghumExtensionRegistry {
  private static instance: SorghumExtensionRegistry;
  private hooks: Map<string, SorghumExtensionHook> = new Map();

  private constructor() {}

  public static getInstance(): SorghumExtensionRegistry {
    if (!SorghumExtensionRegistry.instance) {
      SorghumExtensionRegistry.instance = new SorghumExtensionRegistry();
    }
    return SorghumExtensionRegistry.instance;
  }

  /**
   * Register a new plugin/module hook for Part 3
   */
  public registerHook(hook: SorghumExtensionHook): void {
    this.hooks.set(hook.hookId, hook);
    console.log(`[ExtensionHook] Registered Part 3 Hook: ${hook.hookName} (${hook.hookId})`);
  }

  public unregisterHook(hookId: string): void {
    this.hooks.delete(hookId);
  }

  public async executePreDiagnosis(imageData: string): Promise<void> {
    for (const hook of this.hooks.values()) {
      if (hook.onPreDiagnosis) {
        try {
          await hook.onPreDiagnosis(imageData);
        } catch (e) {
          console.warn(`[ExtensionHook] Error in ${hook.hookId}.onPreDiagnosis`, e);
        }
      }
    }
  }

  public async executePostDiagnosis(result: DiagnosisResult): Promise<void> {
    for (const hook of this.hooks.values()) {
      if (hook.onPostDiagnosis) {
        try {
          await hook.onPostDiagnosis(result);
        } catch (e) {
          console.warn(`[ExtensionHook] Error in ${hook.hookId}.onPostDiagnosis`, e);
        }
      }
    }
  }

  public async executePhiDecrement(remainingDays: number): Promise<void> {
    for (const hook of this.hooks.values()) {
      if (hook.onPhiDayDecremented) {
        try {
          await hook.onPhiDayDecremented(remainingDays);
        } catch (e) {
          console.warn(`[ExtensionHook] Error in ${hook.hookId}.onPhiDayDecremented`, e);
        }
      }
    }
  }

  public getRegisteredHooks(): SorghumExtensionHook[] {
    return Array.from(this.hooks.values());
  }
}
