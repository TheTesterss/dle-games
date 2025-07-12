const NotFoundPage = () => {
    return (
        <main className="flex flex-col flex-grow items-center justify-center px-4 mt-12 ">
            <h2 className="text-4xl font-bold text-center mb-12 text-white">Page Introuvable</h2>
            <p className="max-w-xl text-center text-white">Il semblerait que la page que vous souhaitez atteindre n'existe pas.</p>
            <svg width="300" height="180" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="mb-10 group">
                <circle cx="50" cy="50" r="45"/>
                <circle cx="30" cy="35" r="7" fill="rgb(147 197 253 / 1)"/>
                <circle cx="65" cy="35" r="7" fill="rgb(147 197 253 / 1)"/>
                <line
                    x1="20" y1="65" x2="80" y2="65"
                    stroke="rgb(147 197 253 / 1)"
                    strokeWidth="5"
                    strokeLinecap="round"
                    className="transition duration-300 ease-in-out transform rotate-12 origin-center group-hover:rotate-0"
                />
            </svg>
        </main>
    )
}

export default NotFoundPage;
