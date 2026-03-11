/**
 * useRBAC — Frontend RBAC hook for IWHome 2.0
 * Checks user permissions based on role from Convex database.
 */
import { useQuery } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { api } from "../../../../Backend/convex/_generated/api";

// Permission map mirroring the backend rbac.ts
const PERMISSION_MAP = {
    "fornitori": ["admin", "ceo", "supplier"],
    "collaboratori": ["admin", "ceo", "supervisor"],
    "staff_qr": ["admin", "ceo", "supervisor"],
    "certificati": ["admin", "ceo", "supervisor"],
    "pagamenti": ["admin", "ceo", "supplier", "collaborator_internal", "collaborator_external", "client"],
    "clienti": ["admin", "ceo"],
    "preventivi": ["admin", "ceo"],
    "cantieri": ["admin", "ceo", "supervisor"],
    "admin": ["admin", "ceo"],
    "dashboard": ["admin", "ceo", "client", "supplier", "collaborator_internal", "collaborator_external", "supervisor", "worker", "user"],
    "messages": ["admin", "ceo", "client"],
    "documents": ["admin", "ceo", "client", "supplier", "collaborator_internal", "collaborator_external", "supervisor", "worker", "user"],
    "settings": ["admin", "ceo", "client", "supplier", "collaborator_internal", "collaborator_external", "supervisor", "worker", "user"],
    "appointments": ["admin", "ceo", "client", "supplier", "collaborator_internal", "collaborator_external", "supervisor", "worker", "user"],
};

// Sidebar items with labels and role visibility
export const SIDEBAR_CONFIG = [
    { name: "Dashboard", page: "Dashboard", roles: PERMISSION_MAP.dashboard },
    { name: "Fornitori", page: "Fornitori", roles: PERMISSION_MAP.fornitori },
    { name: "Collaboratori", page: "Collaboratori", roles: PERMISSION_MAP.collaboratori },
    { name: "Staff QR", page: "StaffQR", roles: PERMISSION_MAP.staff_qr },
    { name: "Certificati", page: "Certificati", roles: PERMISSION_MAP.certificati },
    { name: "Pagamenti", page: "Pagamenti", roles: PERMISSION_MAP.pagamenti },
    { name: "Gestione Cantieri", page: "CantieriDashboard", roles: PERMISSION_MAP.cantieri },
    { name: "Clienti", page: "Clienti", roles: PERMISSION_MAP.clienti },
    { name: "Preventivi", page: "Preventivi", roles: PERMISSION_MAP.preventivi },
    { name: "Messaggi", page: "Messages", roles: PERMISSION_MAP.messages },
    { name: "Documenti", page: "Documents", roles: PERMISSION_MAP.documents },
    { name: "Appuntamenti", page: "MyAppointments", roles: PERMISSION_MAP.appointments },
    { name: "Pannello Admin", page: "Admin", roles: PERMISSION_MAP.admin },
    { name: "Impostazioni", page: "Settings", roles: PERMISSION_MAP.settings },
];

export function useRBAC() {
    const { user: clerkUser } = useUser();
    const email = clerkUser?.primaryEmailAddress?.emailAddress || "";
    const convexUser = useQuery(api.users.getByEmail, email ? { email } : "skip");

    const role = convexUser?.role || "user";
    const isAdmin = role === "admin" || role === "ceo";
    const isSupplier = role === "supplier";
    const isCollaborator = role === "collaborator_internal" || role === "collaborator_external";
    const isClient = role === "client";
    const isSupervisor = role === "supervisor";

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
        return allowedRoles.includes(role);
    };

    /**
     * Check if the current user can edit in a specific module.
     * Only admin/ceo can edit most things.
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
            return item.roles.includes(role);
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
