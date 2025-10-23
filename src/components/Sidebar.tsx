import React, { useEffect, useState } from "react";
import axios from 'axios';
import Cookies from 'js-cookie';
import AppConfig from '../auth/config.js';
import AuthService from '../auth/utils/authService';
import SidebarScrollable from './SidebarScrollable';
import {
  FileClock,
  BarChart,
  ChartNoAxesGantt,
  CloudUpload,
  Clock,
  NotebookPen,
  Lightbulb,
  LogOut,
  Package,
  ChevronDown,
  ChevronRight,
  HelpCircle,
  Settings,
  Pin,
  NotebookTabs,
  Network,
  DiamondPercent,
  House,
  LineChart,
  UserCheck2Icon,
  PlaneIcon,
  CalendarCheck,
  List
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import ThemeSelector from "./ThemeSelector";
import { useSidebar } from "@/components/ui/sidebar";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton as SidebarMenuButtonOriginal,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Chip, Tooltip } from "@mui/material"
import Aforce from "../pages/image.png"
import AforceSq from "../pages/AForce.png"

const CustomSidebar = ({ activeTab, setActiveTab, defaultConfig, headerText, setOpenModal, handleLogout }) => {
  const { state: sidebarState, toggleSidebar, isPinned, setIsPinned, isMobile, setOpen } = useSidebar();
  const navigate = useNavigate();
  const [companyData, setCompanyData] = useState(null);
  const [openGroups, setOpenGroups] = useState({
    forecasting: true,
    capacity: true,
    executive: false
  });
  const WEBAPPAPIURL = '/api/v2/';

  type Tab = { id: string; name: string };

  const tabsInitial: Tab[] = [
    { id: "House", name: "Home" },
    { id: "businessPerformance", name: "Performance Metrics" },
    { id: "actualData", name: "Historical Data Analysis" },
    { id: "modelValidation", name: "Model Validation" },
    { id: "forecast", name: "Long Range Forecasting" },
    { id: "insights", name: "Insights & Analysis" },
    { id: "dowIntraday", name: "Short Range Forecasting" },
    { id: "uploadData", name: "Upload Data" },
    { id: "businessPerformance2", name: "Performance Metrics" },
    { id: "planning", name: "Tactical Capacity Plan" },
    { id: "Strategic", name: "Strategic Capacity Plan" },
    { id: "What-If", name: "What-If Simulator" },
    { id: "Occupany", name: "Occupancy Modeling" },
    { id: "Scheduling", name: "Scheduling" },
    { id: "Ops", name: "Realtime OPS Support" },
    { id: "D&A", name: "Dashboards & Analytics" },
    { id: "AGCB", name: "Agent Gauri (Chat bot)" },
    { id: "MAPP", name: "Mobile App" },
    { id: "NewAgent", name: "New Agent" }
  ];

  const executiveTabs: Tab[] = [
    { id: "Executive", name: "Executive Dashboard" },
    { id: "Forecasting", name: "Forecasting" },
    { id: "PlanningHome", name: "Planning" },
    { id: "SchedulingHome", name: "Scheduling" },
    { id: "CXO", name: "CXO Insights" },
    { id: "InterActivity", name: "Interactivity" },
  ];

  const forecastingTabs: Tab[] = [
    { id: "businessPerformance", name: "Performance Metrics" },
    { id: "actualData", name: "Historical Data Analysis" },
    { id: "modelValidation", name: "Model Validation" },
    { id: "forecast", name: "Long Range Forecasting" },
    { id: "insights", name: "Insights & Analysis" },
    { id: "dowIntraday", name: "Short Range Forecasting" },
    { id: "uploadData", name: "Upload Data" },
  ];

  const capacityTabs: Tab[] = [
    { id: "Scheduling", name: "Scheduling" },
    { id: "Ops", name: "Realtime OPS Support" },
    { id: "D&A", name: "Dashboards & Analytics" },
    { id: "AGCB", name: "Agent Gauri (Chat bot)" },
    { id: "MAPP", name: "Mobile App" }
  ];

  const rateTabs: Tab[] = [];

  const toggleGroup = (group: string) => {
    setOpenGroups(prev => ({ ...prev, [group]: !prev[group] }));
  };

  const renderIcon = (id: string) => {
    switch (id) {
      case "Executive":
      case "NewAgent":
        return <UserCheck2Icon className="sidebar-menu-icon" />;
      case "CXO":
        return <LineChart className="sidebar-menu-icon" />;
      case "InterActivity":
      case "What-If":
        return <Network className="sidebar-menu-icon" />;
      case "Forecasting":
      case "businessPerformance":
      case "businessPerformance2":
        return <ChartNoAxesGantt className="sidebar-menu-icon" />;
      case "PlanningHome":
        return <List className="sidebar-menu-icon" />;
      case "SchedulingHome":
        return <CalendarCheck className="sidebar-menu-icon" />;
      case "House":
        return <House className="sidebar-menu-icon" />;
      case "actualData":
        return <FileClock className="sidebar-menu-icon" />;
      case "forecast":
        return <BarChart className="sidebar-menu-icon" />;
      case "modelValidation":
        return <Package className="sidebar-menu-icon" />;
      case "insights":
        return <Lightbulb className="sidebar-menu-icon" />;
      case "planning":
        return <NotebookPen className="sidebar-menu-icon" />;
      case "uploadData":
        return <CloudUpload className="sidebar-menu-icon" />;
      case "Strategic":
        return <NotebookTabs className="sidebar-menu-icon" />;
      case "dowIntraday":
        return <Clock className="sidebar-menu-icon" />;
      case "Occupany":
        return <DiamondPercent className="sidebar-menu-icon" />;
      default:
        return null;
    }
  };

  const ondashboardClick = (id: string) => {
    if (id === "NewAgent") {
      navigate("/new-agent");
      setActiveTab(id);
      return;
    }
    navigate(id === "House" ? "/" : "/dashboard");
    setActiveTab(id);
  };

  const renderTab = (tab: Tab) => (
    <SidebarMenuItem key={tab.id}>
      <SidebarMenuButtonOriginal
        tooltip={tab.name}
        onClick={() => ondashboardClick(tab.id)}
        className={`flex items-center gap-2 py-2 rounded-lg transition-colors duration-200 w-full ${
          activeTab === tab.id
            ? "bg-primary text-secondary-foreground font-bold"
            : "bg-transparent"
        } hover:!bg-sidebar-accent hover:!text-sidebar-accent-foreground ${
          sidebarState === "expanded" ? "pl-2" : ""
        }`}
      >
        {renderIcon(tab.id)}
        <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">
          {tab.name}
          {(tab.id === "Scheduling" || tab.id === "Ops" || tab.id === "D&A" || 
            tab.id === "AGCB" || tab.id === "MAPP") && (
            <Tooltip title="Roadmap" arrow>
              <Chip
                label="R"
                size="small"
                className="colour"
                sx={{ color: "var(--primary-foreground)" }}
              />
            </Tooltip>
          )}
        </span>
      </SidebarMenuButtonOriginal>
    </SidebarMenuItem>
  );

  const renderAIAgentsMenu = () => (
    <SidebarMenuItem key="AIAgents">
      <SidebarMenuButtonOriginal
        tooltip="AI Agents"
        onClick={() => {
          navigate("/new-agent");
          setActiveTab("NewAgent");
        }}
        className={`flex items-center gap-2 py-2 rounded-lg transition-colors duration-200 w-full hover:!bg-sidebar-accent hover:!text-sidebar-accent-foreground ${
          sidebarState === "expanded" ? "pl-2" : ""
        }`}
      >
        <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">
          AI Agents
        </span>
      </SidebarMenuButtonOriginal>
    </SidebarMenuItem>
  );

  useEffect(() => {
    if (isPinned && !isMobile && sidebarState === "collapsed") {
      toggleSidebar();
    }
  }, [isPinned, sidebarState, toggleSidebar, isMobile]);

  function getMimeTypeFromBase64(base64: string): string {
    const signatures: { [key: string]: string } = {
      JVBERi0: 'application/pdf',
      R0lGODdh: 'image/gif',
      R0lGODlh: 'image/gif',
      iVBORw0KGgo: 'image/png',
      '/9j/': 'image/jpeg',
      PD94: 'image/svg+xml',
      PHN2Z: 'image/svg+xml',
    };
    for (const sig in signatures) {
      if (base64.startsWith(sig)) {
        return signatures[sig];
      }
    }
    return 'application/octet-stream';
  }

  return (
    <Sidebar collapsible="icon" className="bg-sidebar-background text-sidebar-foreground">
      <SidebarContent className="mrg-lft">
        <SidebarScrollable>
          <div className="flex flex-col items-center justify-center py-5 border-b border-gray-200 dark:border-gray-700 group mt-9 pad">
            <div className="relative w-[115px] h-[32px] mx-auto mb-0 ml-4">
              {isPinned ? (
                <img
                  src={companyData?.logo ? `data:${getMimeTypeFromBase64(companyData.logo)};base64,${companyData.logo}` : AforceSq}
                  alt="Logo"
                  className="absolute top-1/2 left -translate-x-1/2 -translate-y-1/2"
                  onClick={() => ondashboardClick("House")}
                />
              ) : (
                <>
                  <img
                    src={companyData?.square_logo ? `data:${getMimeTypeFromBase64(companyData.square_logo)};base64,${companyData.square_logo}` : Aforce}
                    alt="Logo"
                    className={`w-8 h-8 absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 ${sidebarState === "collapsed" ? "group-hover:invisible" : "invisible"}`}
                    onClick={() => ondashboardClick("House")}
                  />
                  <img
                    src={companyData?.logo ? `data:${getMimeTypeFromBase64(companyData.logo)};base64,${companyData.logo}` : AforceSq}
                    alt="Logo"
                    className={`absolute top-1/2 left -translate-x-1/2 -translate-y-1/2 ${sidebarState === "collapsed" ? "invisible group-hover:visible" : "visible"}`}
                    onClick={() => ondashboardClick("House")}
                  />
                </>
              )}
            </div>
          </div>

          <SidebarGroup className="w-auto mt-0">
            <SidebarGroupContent className="mt-0">
              <SidebarMenu>
                {/* Home */}
                <SidebarMenuItem>
                  <SidebarMenuButtonOriginal
                    tooltip="Home"
                    onClick={() => ondashboardClick("House")}
                    className={`flex items-center gap-2 py-2 rounded-lg transition-colors duration-200 w-full ${
                      activeTab === "House"
                        ? "bg-primary text-secondary-foreground font-bold"
                        : "bg-transparent"
                    } hover:!bg-sidebar-accent hover:!text-sidebar-accent-foreground ${
                      sidebarState === "expanded" ? "pl-2" : ""
                    }`}
                  >
                    {renderIcon("House")}
                    <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">
                      Home
                    </span>
                  </SidebarMenuButtonOriginal>
                </SidebarMenuItem>

                {/* Forecasting Group */}
                <div>
                  <p
                    onClick={() => toggleGroup("forecasting")}
                    className="group-data-[collapsible=icon]:hidden text-sm font-bold flex w-full items-center justify-between py-2 px-3 cursor-pointer"
                  >
                    <span className="font-semibold">Forecasting</span>
                    {openGroups.forecasting ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </p>
                  {openGroups.forecasting && forecastingTabs.map(renderTab)}
                </div>

                {/* Capacity Group */}
                <div>
                  <p
                    onClick={() => toggleGroup("capacity")}
                    className="group-data-[collapsible=icon]:hidden text-sm font-bold flex w-full items-center justify-between py-2 px-3 cursor-pointer"
                  >
                    <span className="font-semibold">Capacity Planning</span>
                    {openGroups.capacity ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                  </p>
                  {openGroups.capacity && capacityTabs.map(renderTab)}
                </div>

                {/* Rate Tabs & AI Agents */}
                <div>
                  {rateTabs.map(renderTab)}
                  {renderAIAgentsMenu()}
                </div>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarScrollable>
      </SidebarContent>

      <div className="border-t border-sidebar-accent mx-4 my-2"></div>

      <SidebarFooter className="mrg-3">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButtonOriginal
              tooltip={isPinned ? "Unpin Sidebar" : "Pin Sidebar"}
              onClick={() => {
                if (isPinned) {
                  setIsPinned(false);
                  if (!isMobile && sidebarState === "expanded") {
                    setOpen(false);
                  }
                } else {
                  setIsPinned(true);
                  if (!isMobile && sidebarState === "collapsed") {
                    toggleSidebar();
                  }
                }
              }}
              className="flex items-center gap-2 py-2 bg-transparent hover:!bg-sidebar-accent hover:!text-sidebar-accent-foreground rounded-lg transition-colors duration-200"
            >
              <Pin className="h-5 w-5" />
              <span className="text-sm font-medium group-data-[collapsible=icon]:hidden">
                {isPinned ? "Unpin Sidebar" : "Pin Sidebar"}
              </span>
            </SidebarMenuButtonOriginal>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default CustomSidebar;
