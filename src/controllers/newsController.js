export const postNews = async (req, res) => {
    res.json({
        success: true,
        message: "News posted successfully",
        userId: req.userId, // comes from token
    });
};
