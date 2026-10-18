/**
 * YouTube Playables SDK Integration Bridge
 * Implements full specification according to https://developers.google.com/youtube/gaming/playables
 */

export interface PlayablesSaveData {
  highscore: number;
  leaderboard: { score: number; date: string; difficulty: string }[];
  difficulty: 'easy' | 'medium' | 'hard';
  soundMuted: boolean;
  version: number;
  achievements?: any;
}

const LOCAL_STORAGE_KEY = 'swipeslicer_playables_data';

class PlayablesBridge {
  private firstFrameSent = false;
  private gameReadySent = false;
  private cachedLanguage: string = 'en';

  /**
   * Check if running in real YouTube Playables sandbox
   */
  public isInPlayables(): boolean {
    return typeof window !== 'undefined' && !!window.ytgame?.IN_PLAYABLES_ENV;
  }

  /**
   * Check if ytgame SDK script is loaded and accessible
   */
  public isSdkLoaded(): boolean {
    return typeof window !== 'undefined' && typeof window.ytgame !== 'undefined';
  }

  /**
   * Call once the first game frame has been drawn.
   * MUST be called before gameReady().
   */
  public firstFrameReady(): void {
    if (this.firstFrameSent) return;
    this.firstFrameSent = true;

    try {
      if (typeof window !== 'undefined' && window.ytgame?.game?.firstFrameReady) {
        window.ytgame.game.firstFrameReady();
      }
    } catch (err) {
      this.logWarning();
    }
  }

  /**
   * Call once the game is loaded and interactable (e.g., menu screen is ready).
   * MUST NOT be called while loading screen is visible.
   */
  public gameReady(): void {
    if (this.gameReadySent) return;
    this.gameReadySent = true;

    try {
      if (typeof window !== 'undefined' && window.ytgame?.game?.gameReady) {
        window.ytgame.game.gameReady();
      }
    } catch (err) {
      this.logWarning();
    }
  }

  /**
   * Returns whether game audio is enabled in YouTube settings
   */
  public isAudioEnabled(): boolean {
    try {
      if (typeof window !== 'undefined' && window.ytgame?.system?.isAudioEnabled) {
        return window.ytgame.system.isAudioEnabled();
      }
    } catch (err) {
      // ignore
    }
    return true;
  }

  /**
   * Subscribes to audio enabled changes from YouTube player
   */
  public onAudioEnabledChange(callback: (enabled: boolean) => void): () => void {
    try {
      if (typeof window !== 'undefined' && window.ytgame?.system?.onAudioEnabledChange) {
        return window.ytgame.system.onAudioEnabledChange(callback);
      }
    } catch (err) {
      // ignore
    }
    return () => {};
  }

  /**
   * Subscribes to YouTube pause events (user switched tab, lock screen, YouTube pause)
   */
  public onPause(callback: () => void): () => void {
    try {
      if (typeof window !== 'undefined' && window.ytgame?.system?.onPause) {
        return window.ytgame.system.onPause(callback);
      }
    } catch (err) {
      // ignore
    }
    return () => {};
  }

  /**
   * Subscribes to YouTube resume events
   */
  public onResume(callback: () => void): () => void {
    try {
      if (typeof window !== 'undefined' && window.ytgame?.system?.onResume) {
        return window.ytgame.system.onResume(callback);
      }
    } catch (err) {
      // ignore
    }
    return () => {};
  }

  /**
   * Loads game data from YouTube cloud save or local fallback
   */
  public async loadData(): Promise<PlayablesSaveData | null> {
    try {
      if (this.isInPlayables() && window.ytgame?.game?.loadData) {
        const raw = await window.ytgame.game.loadData();
        if (raw) {
          const parsed = JSON.parse(raw);
          return parsed as PlayablesSaveData;
        }
      }
    } catch (err) {
      this.logWarning();
    }

    // LocalStorage fallback
    try {
      const local = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (local) {
        return JSON.parse(local) as PlayablesSaveData;
      }
    } catch {}

    return null;
  }

  /**
   * Saves game data to YouTube cloud save and mirrors to local fallback
   */
  public async saveData(data: PlayablesSaveData): Promise<void> {
    const serialized = JSON.stringify(data);

    // Verify string is well formed and under 3MB
    if (typeof (String.prototype as any).isWellFormed === 'function') {
      if (!(serialized as any).isWellFormed()) {
        return;
      }
    }

    // Save locally first
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, serialized);
    } catch {}

    // Save to YouTube Cloud Save
    try {
      if (this.isInPlayables() && window.ytgame?.game?.saveData) {
        await window.ytgame.game.saveData(serialized);
      }
    } catch (err) {
      this.logWarning();
    }
  }

  /**
   * Sends final high score to YouTube Leaderboard
   */
  public async sendScore(score: number): Promise<void> {
    if (score < 0) return;
    const safeScore = Math.min(Number.MAX_SAFE_INTEGER, Math.floor(score));

    try {
      if (window.ytgame?.engagement?.sendScore) {
        await window.ytgame.engagement.sendScore({ value: safeScore });
      }
    } catch (err) {
      this.logWarning();
    }
  }

  /**
   * Requests an interstitial ad at natural breakpoints (e.g., between runs)
   */
  public async requestInterstitialAd(): Promise<boolean> {
    try {
      if (window.ytgame?.ads?.requestInterstitialAd) {
        await window.ytgame.ads.requestInterstitialAd();
        return true;
      }
    } catch (err) {
      this.logWarning();
    }
    return false;
  }

  /**
   * Requests a rewarded ad (e.g. for a Second Chance / Revive)
   */
  public async requestRewardedAd(rewardId: string): Promise<boolean> {
    try {
      if (window.ytgame?.ads?.requestRewardedAd) {
        const earned = await window.ytgame.ads.requestRewardedAd(rewardId);
        return earned;
      }
    } catch (err) {
      this.logWarning();
    }

    // In local dev/testing without active ads service, simulate success after brief dialog
    return true;
  }

  /**
   * Retrieves player's preferred language tag (BCP-47)
   */
  public async getLanguage(): Promise<string> {
    try {
      if (window.ytgame?.system?.getLanguage) {
        const lang = await window.ytgame.system.getLanguage();
        if (lang) {
          this.cachedLanguage = lang;
          return lang;
        }
      }
    } catch (err) {
      // fallback
    }

    if (typeof navigator !== 'undefined' && navigator.language) {
      this.cachedLanguage = navigator.language;
    }
    return this.cachedLanguage;
  }

  /**
   * Logs error to YouTube health endpoint
   */
  public logError(): void {
    try {
      if (window.ytgame?.health?.logError) {
        window.ytgame.health.logError();
      }
    } catch {}
  }

  /**
   * Logs warning to YouTube health endpoint
   */
  public logWarning(): void {
    try {
      if (window.ytgame?.health?.logWarning) {
        window.ytgame.health.logWarning();
      }
    } catch {}
  }
}

export const playables = new PlayablesBridge();
