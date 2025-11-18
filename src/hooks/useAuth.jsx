import { AuthContext } from "@/context/AuthContext"

const { useContext } = require("react")

export const useAuth = () => {
    return useContext(AuthContext)
}