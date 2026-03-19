/**
 * useRBAC — Frontend RBAC hook for IWHome 2.0
 * Checks user permissions based on role from Convex database.
 */
import { useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../../../Backend/convex/_generated/api";

// Permission map mirroring the backend rbac.ts
const PERMISSION_MAP = {
    "fornitori": ["admin", "supplier"],
    "prezzi": ["admin"],
    "collaboratori": ["admin"],
    "certificati": ["admin"],
    "pagamenti": ["admin", "supplier", "collaborator", "client"],
    "clienti": ["admin"],
    "preventivi": ["admin", "client"],
    "cantieri": ["admin", "collaborator"],
    "admin": ["admin"],
    "dashboard": ["admin", "client", "supplier", "collaborator", "user"],
    "messages": ["admin", "client", "collaborator", "supplier"],
    "documents": ["admin", "client", "supplier", "collaborator", "user"],
    "settings": ["admin", "client", "supplier", "collaborator", "user"],
    "appointments": ["admin", "client", "supplier", "collaborator", "user"],
};

// Sidebar items with labels and role visibility
export const SIDEBAR_CONFIG = [
    { name: "Dashboard", page: "Dashboard", roles: PERMISSION_MAP.dashboard },
    { name: "Fornitori", page: "Fornitori", roles: PERMISSION_MAP.fornitori },
    { name: "Collaboratori", page: "Collaboratori", roles: PERMISSION_MAP.collaboratori },
    { name: "Certificati", page: "Certificati", roles: PERMISSION_MAP.certificati },
    { name: "Pagamenti", page: "Pagamenti", roles: PERMISSION_MAP.pagamenti },
    { name: "Gestione Cantieri", page: "CantieriDashboard", roles: PERMISSION_MAP.cantieri },
    { name: "Clienti", page: "Clienti", roles: PERMISSION_MAP.clienti },
    { name: "Preventivi", page: "Preventivi", roles: PERMISSION_MAP.preventivi },
    { name: "Messaggi", page: "Messages", roles: PERMISSION_MAP.messages },
    { name: "Documenti", page: "Documents", roles: PERMISSION_MAP.documents },
    { name: "Appuntamenti", page: "MyAppointments", roles: PERMISSION_MAP.appointments },
    { name: "Pannello Admin", page: "Admin", roles: PERMISSION_MAP.admin },
    { name: "Prezzi Edilizia", page: "Prezzi", roles: PERMISSION_MAP.prezzi },
    { name: "Impostazioni", page: "Settings", roles: PERMISSION_MAP.settings }];

export function useRBAC() {
    const { user: clerkUser } = useUser();
    const email = clerkUser?.primaryEmailAddress?.emailAddress || "";
    const convexUser = useQuery(api.users.getByEmail, email ? { email } : "skip");

    const role = convexUser?.role || "user";
    const baseRole = role.startsWith("collaborator") ? "collaborator" : role;
    const isAdmin = role === "admin" || role === "superadmin";
    const isSupplier = role === "supplier";
    const isCollaborator = baseRole === "collaborator";
    const isClient = role === "client";
    const isSupervisor = false;

    // RBAC: Get linked supplier record when role is 'supplier'
    const supplierRecord = useQuery(
        api.suppliers.getByUserId,
        isSupplier && convexUser?._id ? { userId: convexUser._id } : "skip"
    );

    /**
     * Check if the current user can view a specific module/page.
     */
    const canView = (module) => {
        if (isAdmin) return true; // Admin sees everything
        const allowedRoles = PERMISSION_MAP[module];
        if (!allowedRoles) return false;
        return allowedRoles.includes(baseRole);
    };

    /**
     * Check if the current user can edit in a specific module.
     * Only admin/superadmin can edit most things.
     */
    const canEdit = (module) => {
        if (isAdmin) return true;
        // Special case: suppliers can edit their own orders
        if (module === "fornitori" && isSupplier) return true;
        // Collaborators can update their own status
        if (module === "collaboratori" && isCollaborator) return true;
        return false;
    };

    /**
     * Get the list of sidebar items visible to the current user.
     */
    const getSidebarItems = () => {
        return SIDEBAR_CONFIG.filter(item => {
            if (isAdmin) return true;
            return item.roles.includes(baseRole);
        });
    };

    return {
        role,
        email,
        convexUser,
        isAdmin,
        isSupplier,
        isCollaborator,
        isClient,
        isSupervisor,
        canView,
        canEdit,
        getSidebarItems,
        supplierRecord: supplierRecord || null,
        supplierId: supplierRecord?._id || null,
        isLoading: convexUser === undefined,
    };
}

export default useRBAC;
