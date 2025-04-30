import { motion } from "framer-motion"

export default function Greeting() {
  return (
    <div className="z-10 absolute top-1/3 -translate-y-1/2">
      <div key="overview" className="max-w-3xl mx-auto md:mt-20 px-4 size-full flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.5 }}
          className="text-2xl font-semibold"
        >
          Prove your Awesome!
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          transition={{ delay: 0.6 }}
          className="text-2xl text-zinc-500"
        >
          Get recognized on blockchain.
        </motion.div>
      </div>
    </div>
  )
}
