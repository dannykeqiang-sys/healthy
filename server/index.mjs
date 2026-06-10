import { createRequire } from 'module';const require = createRequire(import.meta.url);
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// .ice/env.server.ts
process.env.ICE_CORE_MODE = "development";
process.env.ICE_CORE_ROUTER = "true";
process.env.ICE_CORE_ERROR_BOUNDARY = "false";
process.env.ICE_CORE_INITIAL_DATA = "true";
process.env.ICE_CORE_DEV_PORT = "3000";
process.env.ICE_CORE_REMOVE_ROUTES_CONFIG = "false";
process.env.ICE_CORE_REMOVE_DATA_LOADER = "false";

// .ice/entry.server.ts
import { getAppConfig, getDocumentResponse as renderAppToHTML, renderDocumentToResponse as renderAppToResponse } from "@ice/runtime/server";

// src/app.tsx
var app_exports = {};
__export(app_exports, {
  default: () => app_default
});

// .ice/index.ts
import { Link, NavLink, Outlet, useParams, useSearchParams, useLocation, useData, useConfig, useNavigate, useNavigation, useRevalidator, useAsyncValue } from "@ice/runtime/router";
import { defineAppConfig, useAppData, history, useActive, KeepAliveOutlet, useMounted, ClientOnly, withSuspense, useSuspenseData, usePublicAppContext as useAppContext, Await, usePageLifecycle, unstable_useDocumentData, dynamic, Meta, Title, Links, Scripts, FirstChunkCache, Data, Main, usePageAssets } from "@ice/runtime";
import { defineDataLoader, defineServerDataLoader, defineStaticDataLoader } from "@ice/runtime/data-loader";

// src/app.tsx
var app_default = defineAppConfig(() => ({}));

// src/document.tsx
import { jsxDEV as _jsxDEV } from "@ice/runtime/react/jsx-dev-runtime";
function Document() {
  return /* @__PURE__ */ _jsxDEV("html", {
    children: [
      /* @__PURE__ */ _jsxDEV("head", {
        children: [
          /* @__PURE__ */ _jsxDEV("meta", {
            charSet: "utf-8"
          }, void 0, false, {
            fileName: "/Users/ckq/Desktop/source-code/healthy-tracker-temp/src/document.tsx",
            lineNumber: 7,
            columnNumber: 9
          }, this),
          /* @__PURE__ */ _jsxDEV("meta", {
            name: "description",
            content: "icestark framework scaffold"
          }, void 0, false, {
            fileName: "/Users/ckq/Desktop/source-code/healthy-tracker-temp/src/document.tsx",
            lineNumber: 8,
            columnNumber: 9
          }, this),
          /* @__PURE__ */ _jsxDEV("link", {
            rel: "icon",
            href: "/favicon.ico"
          }, void 0, false, {
            fileName: "/Users/ckq/Desktop/source-code/healthy-tracker-temp/src/document.tsx",
            lineNumber: 9,
            columnNumber: 9
          }, this),
          /* @__PURE__ */ _jsxDEV("meta", {
            name: "viewport",
            content: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover"
          }, void 0, false, {
            fileName: "/Users/ckq/Desktop/source-code/healthy-tracker-temp/src/document.tsx",
            lineNumber: 10,
            columnNumber: 9
          }, this),
          /* @__PURE__ */ _jsxDEV(Meta, {}, void 0, false, {
            fileName: "/Users/ckq/Desktop/source-code/healthy-tracker-temp/src/document.tsx",
            lineNumber: 14,
            columnNumber: 9
          }, this),
          /* @__PURE__ */ _jsxDEV(Title, {}, void 0, false, {
            fileName: "/Users/ckq/Desktop/source-code/healthy-tracker-temp/src/document.tsx",
            lineNumber: 15,
            columnNumber: 9
          }, this),
          /* @__PURE__ */ _jsxDEV(Links, {}, void 0, false, {
            fileName: "/Users/ckq/Desktop/source-code/healthy-tracker-temp/src/document.tsx",
            lineNumber: 16,
            columnNumber: 9
          }, this)
        ]
      }, void 0, true, {
        fileName: "/Users/ckq/Desktop/source-code/healthy-tracker-temp/src/document.tsx",
        lineNumber: 6,
        columnNumber: 7
      }, this),
      /* @__PURE__ */ _jsxDEV("body", {
        children: [
          /* @__PURE__ */ _jsxDEV("svg", {
            style: {
              display: "none"
            },
            children: /* @__PURE__ */ _jsxDEV("defs", {
              children: /* @__PURE__ */ _jsxDEV("filter", {
                id: "liquid-distort",
                x: "-10%",
                y: "-10%",
                width: "120%",
                height: "120%",
                children: [
                  /* @__PURE__ */ _jsxDEV("feTurbulence", {
                    type: "fractalNoise",
                    baseFrequency: "0.005",
                    numOctaves: 2,
                    result: "fluid-noise"
                  }, void 0, false, {
                    fileName: "/Users/ckq/Desktop/source-code/healthy-tracker-temp/src/document.tsx",
                    lineNumber: 22,
                    columnNumber: 15
                  }, this),
                  /* @__PURE__ */ _jsxDEV("feGaussianBlur", {
                    in: "fluid-noise",
                    stdDeviation: 3,
                    result: "blurred-noise"
                  }, void 0, false, {
                    fileName: "/Users/ckq/Desktop/source-code/healthy-tracker-temp/src/document.tsx",
                    lineNumber: 23,
                    columnNumber: 15
                  }, this),
                  /* @__PURE__ */ _jsxDEV("feDisplacementMap", {
                    in: "SourceGraphic",
                    in2: "blurred-noise",
                    scale: 20,
                    xChannelSelector: "R",
                    yChannelSelector: "G"
                  }, void 0, false, {
                    fileName: "/Users/ckq/Desktop/source-code/healthy-tracker-temp/src/document.tsx",
                    lineNumber: 24,
                    columnNumber: 15
                  }, this)
                ]
              }, void 0, true, {
                fileName: "/Users/ckq/Desktop/source-code/healthy-tracker-temp/src/document.tsx",
                lineNumber: 21,
                columnNumber: 13
              }, this)
            }, void 0, false, {
              fileName: "/Users/ckq/Desktop/source-code/healthy-tracker-temp/src/document.tsx",
              lineNumber: 20,
              columnNumber: 11
            }, this)
          }, void 0, false, {
            fileName: "/Users/ckq/Desktop/source-code/healthy-tracker-temp/src/document.tsx",
            lineNumber: 19,
            columnNumber: 9
          }, this),
          /* @__PURE__ */ _jsxDEV(Main, {}, void 0, false, {
            fileName: "/Users/ckq/Desktop/source-code/healthy-tracker-temp/src/document.tsx",
            lineNumber: 28,
            columnNumber: 9
          }, this),
          /* @__PURE__ */ _jsxDEV(Scripts, {}, void 0, false, {
            fileName: "/Users/ckq/Desktop/source-code/healthy-tracker-temp/src/document.tsx",
            lineNumber: 29,
            columnNumber: 9
          }, this)
        ]
      }, void 0, true, {
        fileName: "/Users/ckq/Desktop/source-code/healthy-tracker-temp/src/document.tsx",
        lineNumber: 18,
        columnNumber: 7
      }, this)
    ]
  }, void 0, true, {
    fileName: "/Users/ckq/Desktop/source-code/healthy-tracker-temp/src/document.tsx",
    lineNumber: 5,
    columnNumber: 5
  }, this);
}

// asset-manifest:virtual:assets-manifest.json
var virtual_assets_manifest_default = { pages: {}, entries: { main: ["js/main.js", "css/main.css"] }, assets: {}, publicPath: "/", dataLoader: null };

// .ice/route-manifest.json
var route_manifest_default = [
  {
    path: "components/AIRecognitionCelebration",
    id: "components/AIRecognitionCelebration",
    file: "components/AIRecognitionCelebration.tsx",
    componentName: "components-airecognitioncelebration",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/WeightRecordCelebration",
    id: "components/WeightRecordCelebration",
    file: "components/WeightRecordCelebration.tsx",
    componentName: "components-weightrecordcelebration",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/DesktopParallaxSlider",
    id: "components/DesktopParallaxSlider",
    file: "components/DesktopParallaxSlider.tsx",
    componentName: "components-desktopparallaxslider",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/InflammationIndexCard",
    id: "components/InflammationIndexCard",
    file: "components/InflammationIndexCard.tsx",
    componentName: "components-inflammationindexcard",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/InflammationKnowledge",
    id: "components/InflammationKnowledge",
    file: "components/InflammationKnowledge.tsx",
    componentName: "components-inflammationknowledge",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/PredictiveAdviceCard",
    id: "components/PredictiveAdviceCard",
    file: "components/PredictiveAdviceCard.tsx",
    componentName: "components-predictiveadvicecard",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/AIRecordCelebration",
    id: "components/AIRecordCelebration",
    file: "components/AIRecordCelebration.tsx",
    componentName: "components-airecordcelebration",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/GlobalTreeholeInput",
    id: "components/GlobalTreeholeInput",
    file: "components/GlobalTreeholeInput.tsx",
    componentName: "components-globaltreeholeinput",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/HistoryMealSection",
    id: "components/HistoryMealSection",
    file: "components/HistoryMealSection.tsx",
    componentName: "components-historymealsection",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/SodiumAnalysisCard",
    id: "components/SodiumAnalysisCard",
    file: "components/SodiumAnalysisCard.tsx",
    componentName: "components-sodiumanalysiscard",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/TodayNutritionCard",
    id: "components/TodayNutritionCard",
    file: "components/TodayNutritionCard.tsx",
    componentName: "components-todaynutritioncard",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/CelebrationCanvas",
    id: "components/CelebrationCanvas",
    file: "components/CelebrationCanvas.tsx",
    componentName: "components-celebrationcanvas",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/DesktopRightPanel",
    id: "components/DesktopRightPanel",
    file: "components/DesktopRightPanel.tsx",
    componentName: "components-desktoprightpanel",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/WeightRecordModal",
    id: "components/WeightRecordModal",
    file: "components/WeightRecordModal.tsx",
    componentName: "components-weightrecordmodal",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/ActivityBurnCard",
    id: "components/ActivityBurnCard",
    file: "components/ActivityBurnCard.tsx",
    componentName: "components-activityburncard",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/BatchImportModal",
    id: "components/BatchImportModal",
    file: "components/BatchImportModal.tsx",
    componentName: "components-batchimportmodal",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/CalorieDashboard",
    id: "components/CalorieDashboard",
    file: "components/CalorieDashboard.tsx",
    componentName: "components-caloriedashboard",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/DailyReviewPanel",
    id: "components/DailyReviewPanel",
    file: "components/DailyReviewPanel.tsx",
    componentName: "components-dailyreviewpanel",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/ExerciseCardSlot",
    id: "components/ExerciseCardSlot",
    file: "components/ExerciseCardSlot.tsx",
    componentName: "components-exercisecardslot",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/HistoryDataTable",
    id: "components/HistoryDataTable",
    file: "components/HistoryDataTable.tsx",
    componentName: "components-historydatatable",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/HistoryDayEditor",
    id: "components/HistoryDayEditor",
    file: "components/HistoryDayEditor.tsx",
    componentName: "components-historydayeditor",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/SmartAdvicePanel",
    id: "components/SmartAdvicePanel",
    file: "components/SmartAdvicePanel.tsx",
    componentName: "components-smartadvicepanel",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/TodayDualRingBar",
    id: "components/TodayDualRingBar",
    file: "components/TodayDualRingBar.tsx",
    componentName: "components-todaydualringbar",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/UserProfilePanel",
    id: "components/UserProfilePanel",
    file: "components/UserProfilePanel.tsx",
    componentName: "components-userprofilepanel",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/VoiceInputButton",
    id: "components/VoiceInputButton",
    file: "components/VoiceInputButton.tsx",
    componentName: "components-voiceinputbutton",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/WaterWeightChart",
    id: "components/WaterWeightChart",
    file: "components/WaterWeightChart.tsx",
    componentName: "components-waterweightchart",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/WeeklyStatsModal",
    id: "components/WeeklyStatsModal",
    file: "components/WeeklyStatsModal.tsx",
    componentName: "components-weeklystatsmodal",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/ExerciseTracker",
    id: "components/ExerciseTracker",
    file: "components/ExerciseTracker.tsx",
    componentName: "components-exercisetracker",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/ExportDataModal",
    id: "components/ExportDataModal",
    file: "components/ExportDataModal.tsx",
    componentName: "components-exportdatamodal",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/HistoryTimeline",
    id: "components/HistoryTimeline",
    file: "components/HistoryTimeline.tsx",
    componentName: "components-historytimeline",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/MacroRhythmBars",
    id: "components/MacroRhythmBars",
    file: "components/MacroRhythmBars.tsx",
    componentName: "components-macrorhythmbars",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/OnboardingPanel",
    id: "components/OnboardingPanel",
    file: "components/OnboardingPanel.tsx",
    componentName: "components-onboardingpanel",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/TodayWeightCard",
    id: "components/TodayWeightCard",
    file: "components/TodayWeightCard.tsx",
    componentName: "components-todayweightcard",
    layout: false,
    exports: [
      "default",
      "loadWeightRecords"
    ]
  },
  {
    path: "components/TutorialOverlay",
    id: "components/TutorialOverlay",
    file: "components/TutorialOverlay.tsx",
    componentName: "components-tutorialoverlay",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/AnalyticsPanel",
    id: "components/AnalyticsPanel",
    file: "components/AnalyticsPanel.tsx",
    componentName: "components-analyticspanel",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/DualCurveChart",
    id: "components/DualCurveChart",
    file: "components/DualCurveChart.tsx",
    componentName: "components-dualcurvechart",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/MacroRingChart",
    id: "components/MacroRingChart",
    file: "components/MacroRingChart.tsx",
    componentName: "components-macroringchart",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/AIHealingCard",
    id: "components/AIHealingCard",
    file: "components/AIHealingCard.tsx",
    componentName: "components-aihealingcard",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/DesktopHeader",
    id: "components/DesktopHeader",
    file: "components/DesktopHeader.tsx",
    componentName: "components-desktopheader",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/SettingsPanel",
    id: "components/SettingsPanel",
    file: "components/SettingsPanel.tsx",
    componentName: "components-settingspanel",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/WaterCardSlot",
    id: "components/WaterCardSlot",
    file: "components/WaterCardSlot.tsx",
    componentName: "components-watercardslot",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/DateSwitcher",
    id: "components/DateSwitcher",
    file: "components/DateSwitcher.tsx",
    componentName: "components-dateswitcher",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/FeatureGuide",
    id: "components/FeatureGuide",
    file: "components/FeatureGuide.tsx",
    componentName: "components-featureguide",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/MealCardSlot",
    id: "components/MealCardSlot",
    file: "components/MealCardSlot.tsx",
    componentName: "components-mealcardslot",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/MealCarousel",
    id: "components/MealCarousel",
    file: "components/MealCarousel.tsx",
    componentName: "components-mealcarousel",
    layout: false,
    exports: [
      "CARD_ORDER",
      "EXERCISE_CONFIG_BASE",
      "IMAGE_POOLS",
      "MEAL_CONFIGS_BASE",
      "WATER_CONFIG_BASE",
      "default",
      "getDailyImageUrl"
    ]
  },
  {
    path: "components/WaterTracker",
    id: "components/WaterTracker",
    file: "components/WaterTracker.tsx",
    componentName: "components-watertracker",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/WeeklyCharts",
    id: "components/WeeklyCharts",
    file: "components/WeeklyCharts.tsx",
    componentName: "components-weeklycharts",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/AIChatPanel",
    id: "components/AIChatPanel",
    file: "components/AIChatPanel.tsx",
    componentName: "components-aichatpanel",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/AdvicePanel",
    id: "components/AdvicePanel",
    file: "components/AdvicePanel.tsx",
    componentName: "components-advicepanel",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/MealTracker",
    id: "components/MealTracker",
    file: "components/MealTracker.tsx",
    componentName: "components-mealtracker",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/VideoIntro",
    id: "components/VideoIntro",
    file: "components/VideoIntro.tsx",
    componentName: "components-videointro",
    layout: false,
    exports: [
      "VIDEO_URL",
      "default"
    ]
  },
  {
    path: "components/WeightChip",
    id: "components/WeightChip",
    file: "components/WeightChip.tsx",
    componentName: "components-weightchip",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/BottomNav",
    id: "components/BottomNav",
    file: "components/BottomNav.tsx",
    componentName: "components-bottomnav",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/AIDrawer",
    id: "components/AIDrawer",
    file: "components/AIDrawer.tsx",
    componentName: "components-aidrawer",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/BMICard",
    id: "components/BMICard",
    file: "components/BMICard.tsx",
    componentName: "components-bmicard",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "components/Navbar",
    id: "components/Navbar",
    file: "components/Navbar.tsx",
    componentName: "components-navbar",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "register",
    id: "register",
    file: "register.tsx",
    componentName: "register",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    index: true,
    id: "/",
    file: "index.tsx",
    componentName: "index",
    layout: false,
    exports: [
      "default"
    ]
  },
  {
    path: "login",
    id: "login",
    file: "login.tsx",
    componentName: "login",
    layout: false,
    exports: [
      "default"
    ]
  }
];

// .ice/entry.server.ts
var commons = [];
var statics = [];
var createRoutes = () => route_manifest_default;
var runtimeModules = {
  commons,
  statics
};
var getRouterBasename = () => {
  var _a, _b, _c, _d;
  const appConfig = getAppConfig(app_exports);
  return (_d = (_c = (_a = appConfig == null ? void 0 : appConfig.router) == null ? void 0 : _a.basename) != null ? _c : typeof window !== "undefined" && ((_b = window.ICESTARK) == null ? void 0 : _b.basename) || "/") != null ? _d : "";
};
async function renderToHTML(requestContext, options = {}) {
  const mergedOptions = mergeOptions(options);
  return await renderAppToHTML(requestContext, mergedOptions);
}
async function renderToResponse(requestContext, options = {}) {
  const mergedOptions = mergeOptions(options);
  return renderAppToResponse(requestContext, mergedOptions);
}
function mergeOptions(options) {
  const { renderMode = "SSR", basename, publicPath } = options;
  if (publicPath) {
    virtual_assets_manifest_default.publicPath = publicPath;
  }
  return {
    ...options,
    app: app_exports,
    assetsManifest: virtual_assets_manifest_default,
    createRoutes,
    runtimeModules,
    documentDataLoader: void 0,
    Document,
    basename: basename || getRouterBasename(),
    renderMode
  };
}
export {
  renderToHTML,
  renderToResponse
};
//# sourceMappingURL=index.mjs.map
