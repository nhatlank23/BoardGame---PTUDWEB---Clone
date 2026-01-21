import { create } from "zustand";

export const useAchievementStore = create((set) => ({
    unlockedAchievements: [],
    showNotification: false,

    addAchievements: (achievements) => {
        if (achievements && achievements.length > 0) {
            set((state) => ({
                unlockedAchievements: [...state.unlockedAchievements, ...achievements],
                showNotification: true,
            }));
        }
    },

    clearAchievements: () => {
        set({
            unlockedAchievements: [],
            showNotification: false,
        });
    },
}));
