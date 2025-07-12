const PolicyPrivacy = ({ navigateTo }) => {
    return (
        <main className="flex flex-col items-center justify-center min-h-[60vh] px-4">
            <h2 className="text-4xl font-bold text-center mb-12 text-white">Politique de confidentialité</h2>
            <p className="max-w-xl text-center text-white">En utilisant ce site, vous acceptez nos conditions d'utilisation. Merci de respecter les règles et de profiter de votre visite.</p>
            <button
                onClick={() => navigateTo('/')}
                className="bg-blue-300 text-gray-900 px-4 py-2 rounded hover:bg-blue-700 mt-10 transition ease-in-out duration-200"
            >
                Revenir
            </button>
        </main>
    )
}

export default PolicyPrivacy;