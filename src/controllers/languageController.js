
export const getLanguage = (req, res) => {
    res.json({
        success: true,
        language: req.language,
        translations: req.t ? req.t : {},
    });
};
