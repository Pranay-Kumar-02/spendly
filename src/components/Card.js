import React from "react";
import { motion } from "framer-motion";

const Card = ({
    children,
    gradient = false,
    color = null,
    padding = "20px",
    marginBottom = "16px",
    borderLeft = null,
    onClick = null,
    delay = 0,
    hover = false,
}) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay, duration: 0.4 }}
            whileHover={hover ? { scale: 1.02, boxShadow: "0 8px 30px rgba(124,58,237,0.2)" } : {}}
            onClick={onClick}
            style={{
                background: gradient
                    ? "linear-gradient(135deg, #7C3AED 0%, #EC4899 100%)"
                    : color || "var(--card-bg)",
                borderRadius: 20,
                padding,
                marginBottom,
                boxShadow: "var(--shadow)",
                border: borderLeft ? `none` : "none",
                borderLeft: borderLeft ? `4px solid ${borderLeft}` : "none",
                cursor: onClick ? "pointer" : "default",
                transition: "all 0.3s ease",
            }}>
            {children}
        </motion.div>
    );
};

export default Card;