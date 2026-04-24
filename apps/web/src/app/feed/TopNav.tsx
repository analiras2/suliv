"use client";

import MdiIcon from "@mdi/react";
import {
  mdiHome, mdiHomeOutline,
  mdiMagnify,
  mdiHeart, mdiHeartOutline,
  mdiAccount, mdiAccountOutline,
  mdiBellOutline,
} from "@mdi/js";
import { Logo } from "../../components/Logo";

const O = {
  sand25: "#FDFBF6", sand100: "#F3ECDD",
  moss700: "#2D4522",
  ink200: "#D4CCBB", ink500: "#6F675C",
  clay500: "#B4714D",
};

export type FeedTab = "feed" | "search" | "favorites" | "profile";

const TABS = [
  { id: "feed"      as FeedTab, label: "Feed",      icon: mdiHome,    iconOutline: mdiHomeOutline     },
  { id: "search"    as FeedTab, label: "Busca",     icon: mdiMagnify, iconOutline: mdiMagnify         },
  { id: "favorites" as FeedTab, label: "Favoritos", icon: mdiHeart,   iconOutline: mdiHeartOutline    },
  { id: "profile"   as FeedTab, label: "Perfil",    icon: mdiAccount, iconOutline: mdiAccountOutline  },
];

interface TopNavProps {
  activeTab: FeedTab;
  onTabChange: (tab: FeedTab) => void;
}

export function TopNav({ activeTab, onTabChange }: TopNavProps) {
  return (
    <header style={{
      position: "sticky", top: 0, zIndex: 30,
      backgroundColor: "rgba(243,236,221,0.96)",
      borderBottom: `1px solid ${O.ink200}`,
      backdropFilter: "blur(8px)",
      WebkitBackdropFilter: "blur(8px)",
    }}>
      <div style={{
        maxWidth: 1100, margin: "0 auto",
        padding: "0 20px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        height: 60,
      }}>
        <Logo width={88} height={33} colorScheme="light" />

        <nav style={{ display: "flex", alignItems: "center", gap: 2 }} role="tablist">
          {TABS.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onTabChange(tab.id)}
                style={{
                  display: "flex", flexDirection: "column", alignItems: "center", gap: 3,
                  padding: "7px 14px",
                  background: "none", border: "none", cursor: "pointer",
                  borderRadius: 12,
                  color: isActive ? O.moss700 : O.ink500,
                  fontFamily: "inherit",
                  transition: "color 140ms, background 140ms",
                }}
              >
                <MdiIcon
                  path={isActive ? tab.icon : tab.iconOutline}
                  size={0.85}
                  color={isActive ? O.moss700 : O.ink500}
                />
                <span style={{
                  fontSize: 10.5,
                  fontWeight: isActive ? 600 : 500,
                  letterSpacing: "0.01em",
                  lineHeight: 1,
                }}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </nav>

        <button
          aria-label="Notificações"
          style={{
            width: 38, height: 38, borderRadius: "50%",
            background: O.sand25,
            border: `1px solid ${O.ink200}`,
            display: "flex", alignItems: "center", justifyContent: "center",
            cursor: "pointer", position: "relative",
          }}
        >
          <MdiIcon path={mdiBellOutline} size={0.78} color={O.ink500} />
          <div style={{
            position: "absolute", top: 8, right: 9,
            width: 7, height: 7, borderRadius: "50%",
            background: O.clay500,
            border: `1.5px solid ${O.sand25}`,
          }} />
        </button>
      </div>
    </header>
  );
}
