export default function TodayPage() {
    return (
        <div className="max-w-md mx-auto p-4 space-y-8">
            <header className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Today</h1>
                <div className="text-sm text-gray-500">Feb 16</div>
            </header>

            {/* Focus Sprint CTA */}
            <section className="bg-blue-50 p-6 rounded-xl text-center space-y-4">
                <h2 className="text-lg font-semibold text-blue-900">Ready to focus?</h2>
                <button className="bg-blue-600 text-white px-6 py-3 rounded-full font-medium hover:bg-blue-700 transition w-full">
                    Start 25m Sprint
                </button>
            </section>

            {/* Must Do */}
            <section>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">Must Do (0/3)</h3>
                <ul className="space-y-3">
                    <li className="p-4 border rounded-lg shadow-sm flex items-start gap-4">
                        <div className="w-5 h-5 rounded-full border-2 border-gray-300 mt-1" />
                        <div>
                            <p className="font-medium">Finish project setup</p>
                            <p className="text-sm text-gray-500">25m • Coding</p>
                        </div>
                    </li>
                </ul>
            </section>

            {/* Optional */}
            <section>
                <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-3">Optional (0/4)</h3>
                <p className="text-gray-400 text-sm italic">No optional tasks yet.</p>
            </section>

            {/* Next Action Panel */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-white border-t">
                <div className="max-w-md mx-auto">
                    <p className="text-xs text-blue-600 font-bold uppercase mb-1">Next Action</p>
                    <p className="font-medium">Run `npm run dev` to verify the setup.</p>
                </div>
            </div>
        </div>
    )
}
