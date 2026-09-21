/* eslint-disable */
/**
 * Frontend Convex API tree — HAND-MAINTAINED STUB matching `npx convex codegen`.
 *
 * The workspace has no authenticated Convex deployment to run codegen, so this
 * module constructs the same typed `FunctionReference` objects the codegen
 * would emit, using `makeFunctionReference` with the exact "module:function"
 * identifiers. Works at runtime with ConvexClient and provides full typing.
 */
import type { FunctionReference } from "convex/server";
import { makeFunctionReference } from "convex/server";

type PublicQuery = FunctionReference<"query", "public", any, any>;
type PublicMutation = FunctionReference<"mutation", "public", any, any>;
type PublicAction = FunctionReference<"action", "public", any, any>;

const q = (id: string) => makeFunctionReference<"query", any, any>(id);
const m = (id: string) => makeFunctionReference<"mutation", any, any>(id);
const a = (id: string) => makeFunctionReference<"action", any, any>(id);

const auth = {
  signIn: m("auth:signIn") as PublicMutation,
  signOut: m("auth:signOut") as PublicMutation,
  signUp: m("auth:signUp") as PublicMutation,
  isAuthenticated: q("auth:isAuthenticated") as PublicQuery,
};

const bookings = {
  getMyBookings: q("bookings:getMyBookings"),
  getAllBookings: q("bookings:getAllBookings"),
  getBookingByReference: q("bookings:getBookingByReference"),
  createBooking: m("bookings:createBooking"),
  confirmPayment: m("bookings:confirmPayment"),
  cancelBooking: m("bookings:cancelBooking"),
  initializePaystackPayment: a("bookings:initializePaystackPayment"),
  getBookingInternal: q("bookings:getBookingInternal"),
};

const http = {};

const legalDocuments = {
  getDocumentByReference: q("legalDocuments:getDocumentByReference"),
  getMyDocuments: q("legalDocuments:getMyDocuments"),
  getPendingDocuments: q("legalDocuments:getPendingDocuments"),
  generateDeedOfAssignment: a("legalDocuments:generateDeedOfAssignment"),
  createDocumentRecord: m("legalDocuments:createDocumentRecord"),
  updateDocumentStatus: m("legalDocuments:updateDocumentStatus"),
  reviewDocument: m("legalDocuments:reviewDocument"),
  getClientInternal: q("legalDocuments:getClientInternal"),
  getPlotWithProject: q("legalDocuments:getPlotWithProject"),
};

const notifications = {
  sendWhatsAppTemplate: a("notifications:sendWhatsAppTemplate"),
  logNotification: m("notifications:logNotification"),
  getRecentNotifications: q("notifications:getRecentNotifications"),
};

const partners = {
  submitAgentApplication: m("partners:submitAgentApplication"),
  submitManagerApplication: m("partners:submitManagerApplication"),
  listAgentApplications: q("partners:listAgentApplications"),
  reviewAgentApplication: m("partners:reviewAgentApplication"),
  listManagers: q("partners:listManagers"),
  reviewManagerApplication: m("partners:reviewManagerApplication"),
};

const plots = {
  listPlots: q("plots:listPlots"),
  getPlot: q("plots:getPlot"),
  getPlotsByProject: q("plots:getPlotsByProject"),
  getAvailablePlotCount: q("plots:getAvailablePlotCount"),
  createPlot: m("plots:createPlot"),
  verifyPlotTitle: m("plots:verifyPlotTitle"),
  updatePlotStatus: m("plots:updatePlotStatus"),
  updatePlotPrice: m("plots:updatePlotPrice"),
  generateUploadUrl: m("plots:generateUploadUrl"),
};

const projects = {
  listProjects: q("projects:listProjects"),
  getProject: q("projects:getProject"),
  createProject: m("projects:createProject"),
  updateProject: m("projects:updateProject"),
  getPlatformStats: q("projects:getPlatformStats"),
};

const serviceRequests = {
  submitServiceRequest: m("serviceRequests:submitServiceRequest"),
  getByReference: q("serviceRequests:getByReference"),
  listRequests: q("serviceRequests:listRequests"),
  getStatusCounts: q("serviceRequests:getStatusCounts"),
  reviewServiceRequest: m("serviceRequests:reviewServiceRequest"),
  getMyRequests: q("serviceRequests:getMyRequests"),
};

const services = {
  listServices: q("services:listServices"),
  getService: q("services:getService"),
  upsertService: m("services:upsertService"),
  setServiceActive: m("services:setServiceActive"),
};

const settings = {
  getIntegrationStatus: q("settings:getIntegrationStatus"),
};

const users = {
  listUsers: q("users:listUsers"),
  getRoleCounts: q("users:getRoleCounts"),
};

const milestones = {
  listMilestones: q("milestones:listMilestones"),
  createMilestone: m("milestones:createMilestone"),
};

const whatsapp = {
  handleIncoming: a("whatsapp:handleIncoming"),
  getSession: q("whatsapp:getSession"),
  getDocByRef: q("whatsapp:getDocByRef"),
  // updateSession is an internalMutation — only callable from handleIncoming
  // server-side, never exposed to the frontend.
  getHumanReviewQueue: q("whatsapp:getHumanReviewQueue"),
  resolveSession: m("whatsapp:resolveSession"),
};

export const api: {
  auth: typeof auth;
  bookings: typeof bookings;
  http: typeof http;
  legalDocuments: typeof legalDocuments;
  milestones: typeof milestones;
  notifications: typeof notifications;
  partners: typeof partners;
  plots: typeof plots;
  projects: typeof projects;
  serviceRequests: typeof serviceRequests;
  services: typeof services;
  settings: typeof settings;
  users: typeof users;
  whatsapp: typeof whatsapp;
} = {
  auth,
  bookings,
  http,
  legalDocuments,
  milestones,
  notifications,
  partners,
  plots,
  projects,
  serviceRequests,
  services,
  settings,
  users,
  whatsapp,
};
