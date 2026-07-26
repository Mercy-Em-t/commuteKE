// Footer Component inside Passenger View
export function PassengerFooter() {
    return (
        <footer className="w-full py-3 bg-slate-900 text-center text-xs text-slate-400 border-t border-slate-800 mt-auto">
            <p>© {new Date().getFullYear()} Kiungani Transit. All rights reserved.</p>
            <p className="font-semibold text-sky-400 mt-0.5">
                Powered by <a href="https://transport.tmsavannah.com" target="_blank" rel="noreferrer" className="underline">TM Savannah</a>
            </p>
        </footer>
    );
}

export default PassengerFooter;
