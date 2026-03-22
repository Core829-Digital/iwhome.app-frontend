import Admin from './pages/Admin';
// Appuntamenti removed — all appointment booking flows through Calcolatore
import Blog from './pages/Blog';
import BlogPost from './pages/BlogPost';
import Calcolatore from './pages/Calcolatore';
import Certificati from './pages/Certificati';
import ChiSiamo from './pages/ChiSiamo';
// import ClientChat from './pages/ClientChat'; // Removed
import Collaboratori from './pages/Collaboratori';
// import CompanyDashboard from './pages/CompanyDashboard'; // Removed — ruolo company eliminato
import CantieriDashboard from './pages/CantieriDashboard';
import Contatti from './pages/Contatti';
import Cookie from './pages/Cookie';
import Clienti from './pages/Clienti';
import DailyLogs from './pages/DailyLogs';
import Tasks from './pages/Tasks';
import Dashboard from './pages/Dashboard';
import Documents from './pages/Documents';
import Fornitori from './pages/Fornitori';
import Home from './pages/Home';
import Messages from './pages/Messages';
import MyAppointments from './pages/MyAppointments';
import Pagamenti from './pages/Pagamenti';
import PdfEditor from './pages/PdfEditor';
import Preventivi from './pages/Preventivi';
import Prezzi from './pages/Prezzi';
import CodiceReferral from './pages/CodiceReferral';
import Privacy from './pages/Privacy';
import Recensioni from './pages/Recensioni';
import Servizi from './pages/Servizi';
import Settings from './pages/Settings';
import SharedDocuments from './pages/SharedDocuments';
// StaffQR removed for simplification
import SupplierOnboarding from './pages/SupplierOnboarding';
import OnboardingStaff from './pages/OnboardingStaff';
import Termini from './pages/Termini';
import UploadDocument from './pages/UploadDocument';
// QRAccess removed for simplification
import __Layout from './Layout.jsx';


export const PAGES = {
    "Admin": Admin,
    "Appuntamenti": Calcolatore, // Redirected — appointment booking starts from Calcolatore
    "Blog": Blog,
    "BlogPost": BlogPost,
    "Calcolatore": Calcolatore,
    "Certificati": Certificati,
    "ChiSiamo": ChiSiamo,
    "ClientChat": Messages, // Redirected to Messages (Unified)
    "Collaboratori": Collaboratori,
    "CompanyDashboard": Dashboard, // Redirect a Dashboard — ruolo company eliminato
    "CantieriDashboard": CantieriDashboard,
    "Contatti": Contatti,
    "Cookie": Cookie,
    "Clienti": Clienti,
    "DailyLogs": DailyLogs,
    "Tasks": Tasks,
    "Dashboard": Dashboard,
    "Documents": Documents,
    "Fornitori": Fornitori,
    "Home": Home,
    "Messages": Messages,
    "MyAppointments": MyAppointments,
    "Pagamenti": Pagamenti,
    "PdfEditor": PdfEditor,
    "Preventivi": Preventivi,
    "Prezzi": Prezzi,
    "CodiceReferral": CodiceReferral,
    "Privacy": Privacy,
    "Recensioni": Recensioni,
    "Servizi": Servizi,
    "Settings": Settings,
    "SharedDocuments": SharedDocuments,
    "SupplierOnboarding": SupplierOnboarding,
    "onboarding-staff": OnboardingStaff,
    "Termini": Termini,
    "UploadDocument": UploadDocument,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};
